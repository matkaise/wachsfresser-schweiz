# Stripe Setup für Wachsfresser

Stand: 2026-06-12

## Was eingebaut ist

- Node/Express-Server auf `server.js`
- Stripe Checkout Session für Einmalzahlungen
- Servervalidierung des Warenkorbs gegen `Website Dummy/products.jsx`
- Zahlung per dynamischer Stripe-Auswahl, Karte oder TWINT
- Lieferadresse wird in Stripe Checkout gesammelt
- Erfolgsseite: `Website Dummy/checkout-success.html`
- Abbruchseite: `Website Dummy/checkout-cancel.html`
- Webhook-Endpunkt: `/api/stripe/webhook`
- Lokales Event-Log für wichtige Stripe-Events: `orders/stripe-events.ndjson`

## Lokaler Start

1. Abhängigkeiten installieren:

   ```powershell
   npm install
   ```

2. `.env.example` zu `.env` kopieren und Werte setzen:

   ```powershell
   Copy-Item .env.example .env
   ```

3. In `.env` mindestens setzen:

   ```env
   STRIPE_SECRET_KEY=sk_test_xxx
   PORT=8080
   SITE_URL=http://127.0.0.1:8080
   SHIPPING_CH_CENTS=0
   SHIPPING_EU_CENTS=0
   ```

4. Server starten:

   ```powershell
   npm start
   ```

5. Website öffnen:

   ```text
   http://127.0.0.1:8080/Wachsfresser.html
   ```

## Versandpreise

Die Versandpreise sind aktuell noch Platzhalter. Vor dem Livegang müssen sie in Rappen gesetzt werden:

```env
SHIPPING_CH_CENTS=790
SHIPPING_EU_CENTS=1890
```

Beispiele:

- `790` = CHF 7.90
- `0` = kostenloser Versand

## TWINT

TWINT kann in Stripe Checkout genutzt werden, wenn:

- dein Stripe-Konto TWINT unterstützt und TWINT im Dashboard aktiviert ist
- alle Positionen in `chf` abgerechnet werden
- es sich um eine Einmalzahlung handelt

Wenn TWINT im Checkout ausgewählt wird, erstellt der Server eine Session nur mit `twint`. Bei `Stripe Auswahl` entscheidet Stripe anhand Dashboard-Einstellungen und Berechtigung, welche Zahlungsarten angezeigt werden.

## Webhooks lokal testen

Mit Stripe CLI:

```powershell
stripe listen --forward-to http://127.0.0.1:8080/api/stripe/webhook
```

Den ausgegebenen `whsec_...` Wert in `.env` setzen:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Danach den Server neu starten.

## Livegang-Checkliste

- Echte Versandpreise setzen
- `SITE_URL` auf die produktive Domain setzen
- Stripe Live Secret Key als Hosting-Secret setzen
- Webhook im Stripe Dashboard auf `/api/stripe/webhook` einrichten
- TWINT/Karte im Stripe Dashboard aktivieren
- Testbestellung mit Stripe-Testdaten durchführen
- Rechtstexte, Datenschutz, AGB und Impressum finalisieren
- E-Mail-Bestätigung oder Fulfillment-Prozess ergänzen

## Offizielle Stripe-Referenzen

- Checkout Sessions: https://docs.stripe.com/api/checkout/sessions/create
- Stripe Checkout Quickstart: https://docs.stripe.com/checkout/quickstart
- Payment-Method-Optionen: https://docs.stripe.com/payments/payment-methods/integration-options
- TWINT: https://docs.stripe.com/payments/twint/accept-a-payment
- API-Versioning: https://docs.stripe.com/api/versioning
