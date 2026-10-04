/* shop-app.jsx — Shop-Seite */
function ShopApp() {
  return <ShopFrame current="shop" render={({ onAdd }) => <ShopPage onAdd={onAdd}/>}/>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<ShopApp/>);
