# Cloudflare Betriebskonzept

Stand: 2026-06-12

## Zielbild

Der Shop läuft als Cloudflare Worker mit statischen Assets. Der Worker übernimmt:

- Website-Auslieferung über Cloudflare Static Assets
- Stripe Checkout Session erstellen
- Stripe Webhooks verifizieren
- Bestellungen in D1 speichern
- Bestell- und Versandmails über Queue auslösen
- Adminbereich für Bestellübersicht und Versandstatus

## Architektur

```text
Kunde
  -> Cloudflare Worker / statische Assets
  -> /api/create-checkout-session
  -> Stripe Checkout
  -> /api/stripe/webhook
  -> D1: orders, order_items, order_events, email_log
  -> Queue: wachsfresser-email-jobs
  -> Cloudflare Send Email Binding oder Resend
```

## Dateien

- `wrangler.jsonc`: Cloudflare-Konfiguration
- `src/worker.mjs`: API, Stripe, Webhook, Admin, Queue Consumer
- `src/product-catalog.mjs`: serverseitiger Produktkatalog für Stripe
- `src/emails.mjs`: E-Mail-Vorlagen
- `migrations/0001_orders.sql`: D1-Schema
- `Website Dummy/admin.html`: Adminoberfläche
- `.dev.vars.example`: lokale Secrets für `wrangler dev`

## Lokale Cloudflare-Entwicklung

1. Abhängigkeiten installieren:

   ```powershell
   npm install
   ```

2. Lokale Secrets vorbereiten:

   ```powershell
   Copy-Item .dev.vars.example .dev.vars
   ```

3. `.dev.vars` mit Testwerten füllen:

   ```env
   STRIPE_SECRET_KEY=sk_test_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ADMIN_TOKEN=local-admin-token
   SITE_URL=http://localhost:8787
   ```

4. Lokale D1-Datenbank migrieren:

   ```powershell
   npm run cf:d1:migrate:local
   ```

5. Worker lokal starten:

   ```powershell
   npm run cf:dev
   ```

6. Website öffnen:

   ```text
   http://localhost:8787/Wachsfresser.html
   ```

7. Admin öffnen:

   ```text
   http://localhost:8787/admin
   ```

## Cloudflare Ressourcen

### D1

Erstellen:

```powershell
npm run cf:d1:create
```

Falls Wrangler die `database_id` nicht automatisch in `wrangler.jsonc` schreibt, den Wert aus der Ausgabe manuell ergänzen:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "wachsfresser-db",
    "database_id": "..."
  }
]
```

Remote-Migration:

```powershell
npm run cf:d1:migrate:remote
```

### Queues

Erstellen:

```powershell
npm run cf:queue:create
```

Die Queue `wachsfresser-email-jobs` verarbeitet Bestell-, Admin- und Versandmails. Die Dead-Letter-Queue sammelt Jobs, die nach mehreren Versuchen fehlschlagen.

### Secrets

Produktiv in Cloudflare setzen:

```powershell
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put ADMIN_TOKEN
```

Optional, falls Resend statt Cloudflare Send Email Binding genutzt wird:

```powershell
npx wrangler secret put RESEND_API_KEY
```

## E-Mail-Versand

Variante A: Cloudflare Send Email Binding

- Domain muss über Cloudflare DNS laufen.
- Email Routing aktivieren und Send Email Binding nutzen.
- Absenderadresse verifizieren.
- `send_email` Binding in `wrangler.jsonc` bleibt aktiv.

Variante B: Resend

- `RESEND_API_KEY` als Secret setzen.
- Domain bei Resend verifizieren.
- Falls Cloudflare Send Email nicht aktiv ist, das `send_email` Binding in `wrangler.jsonc` entfernen oder deaktivieren.

Der Worker wählt automatisch:

1. Cloudflare Email Binding, falls vorhanden
2. Resend, falls `RESEND_API_KEY` vorhanden
3. E-Mail als `skipped` im `email_log`, falls kein Provider konfiguriert ist

## Stripe Webhook

In Stripe einen Webhook einrichten:

```text
https://wachsfresser-schweiz.ch/api/stripe/webhook
```

Events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Den Webhook Signing Secret als `STRIPE_WEBHOOK_SECRET` in Cloudflare setzen.

## Bestellablauf

1. Kunde legt Produkte in den Warenkorb.
2. `/api/create-checkout-session` erstellt eine D1-Bestellung mit Status `pending_checkout`.
3. Stripe Checkout wird geöffnet.
4. Stripe sendet Webhook.
5. Worker verifiziert die Signatur.
6. Bestellung wird auf `paid` gesetzt.
7. Queue erstellt:
   - Bestätigungsmail an den Kunden
   - interne Mail an `ADMIN_EMAIL`
8. Du öffnest `/admin`, prüfst die Bestellung und trägst Tracking ein.
9. Button `Als verschickt markieren` setzt Status `shipped`.
10. Queue sendet Versandmail an den Kunden.

## Adminzugang

Für Produktion empfehle ich Cloudflare Access auf:

```text
/admin*
/api/admin/*
```

Zusätzlich unterstützt der Worker einen `ADMIN_TOKEN` als Fallback. Im Adminbereich kann dieser Token lokal eingetragen werden.

## Deploy

```powershell
npm run cf:deploy
```

Vor dem echten Livegang:

- Versandpreise in `wrangler.jsonc` oder Cloudflare Vars setzen
- Stripe Live Keys setzen
- Webhook in Stripe auf Produktionsdomain setzen
- E-Mail-Provider testen
- Adminroute mit Cloudflare Access schützen
- Testbestellung vollständig durchspielen

## Offizielle Referenzen

- Cloudflare Static Assets: https://developers.cloudflare.com/workers/static-assets/
- Wrangler-Konfiguration: https://developers.cloudflare.com/workers/wrangler/configuration/
- D1: https://developers.cloudflare.com/d1/get-started/
- Queues: https://developers.cloudflare.com/queues/
- Cloudflare Send Email Binding: https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/
- Stripe Webhooks: https://docs.stripe.com/webhooks
- Stripe Fulfillment: https://docs.stripe.com/checkout/fulfillment
