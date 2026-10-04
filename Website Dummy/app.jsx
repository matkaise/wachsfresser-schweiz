/* app.jsx — Startseite */
function App() {
  return <ShopFrame current="start" render={({ onAdd }) => <HomePage onAdd={onAdd}/>}/>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
