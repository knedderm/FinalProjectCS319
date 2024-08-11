import React from 'react';
import { useState, useEffect } from "react";

var idCount = 0;
function App(){
  const [viewer, setViewer] = useState(0)
  const [stocks, setStocks] = useState([]);
  const [updated, setUpdate] = useState(false)
  const[id, setID] = useState(idCount);
  
  const MyComponent = () => {
    const dateObj = new Date();
    const [date, setDate] = useState(dateObj.toLocaleDateString());
    const [time, setTime] = useState(dateObj.toLocaleTimeString());
    const [status, setStatus] = useState('Open'); // Set this to your default status
    useEffect(() => {
    const intervalId = setInterval(() => {
        const dateObj = new Date();
        setDate(dateObj.toLocaleDateString());
        setTime(dateObj.toLocaleTimeString());

        // Update status based on openclose function
        const currentDay = dateObj.getDay();
        const currentHour = dateObj.getHours();
        const openingHour = 8; // 8:30 AM
        const closingHour = 15; // 3:00 PM

        if (currentDay >= 1 && currentDay <= 5) {
            // Monday to Thursday
            if (currentHour >= openingHour && currentHour <= closingHour) {
                setStatus('Open');
                setUpdate(false);
                fetch("http://localhost:8081/allStocks")
                .then(response => response.json())
                .then(stocks.map(stock => {
                        if (stock.current != null) {
                            var newPrice = stock.current * (Math.random() * (1.01 - .99) + .99);
                        }
                        else if (stock.currentPrice != null) {
                            var newPrice = stock.currentPrice * (Math.random() * (1.01 - .99) + .99);
                        }
                        else {
                            newPrice = (stock.high + stock.low)/2
                        }
                        fetch(`http://localhost:8081/priceUpdate/${stock.ticker}`, {
                            method: 'PUT',
                            headers: { 'content-type': 'application/json' }, 
                            body: JSON.stringify(
                                {
                                "current": Number(newPrice),
                                })
                        })
                }))
            } else {
                setStatus('Closed');
            }
        } else {
            // Saturday and Sunday
            setStatus('Closed');
        }
    }, 1000); // Update every second

    return () => {
        clearInterval(intervalId);
    };
}, []);

    return (
        <div className="card shadow-md" style={{ borderWidth: '5px', borderColor: 'orange', margin: '15px', paddingLeft: '10px', paddingRight: '5%' }}>
            <h2 style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                <span style={{ float: 'left' }}>Today's Date: {date}</span>
                <span>Time: {time}</span>
                <span style={{ float: 'right' }}>Market {status}</span>
            </h2>
        </div>
    );
};
  function GetAllStocks() {
    MyComponent();
    if (!updated) {
    setUpdate(true);
      fetch("http://localhost:8081/allStocks")
      .then(response => response.json())
      .then(stocks => {
          setStocks(stocks);
      })
    }
      return (
        <div>
        {NavBar()}{MyComponent()}
        <div className="container mt-3">
            <div className="display-1">View Stocks</div>
            <div className="row">
            {stocks.map(stock => 
            <div key={stock.ticker} className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
            <div className="card">
            <div className="card-body">
            <h5 className="card-title">{stock.ticker}</h5>
            <p className="card-text">${stock.current}</p>
            <p className="card-text">Open: ${stock.open}</p>
            <p className="card-text">High: ${stock.high}</p>
            <p className="card-text">Low: ${stock.low}</p>    
            </div>
            </div>
            </div>
            )}
            </div>
            </div>
            </div>
      )
  }
  function GetMyStocks() {
    MyComponent();
    if (!updated) {
    setUpdate(true);
      fetch("http://localhost:8081/allPurchased")
      .then(response => response.json())
      .then(stocks => {
          setStocks(stocks);
      })
    }
      return (
        <div>
        {NavBar()}{MyComponent()}
        <div className="container mt-3">
            <div className="display-1">View My Stocks</div>
            <div className="row">
            {stocks.map(stock => 
            <div key={stock.ticker} className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
            <div className="card">
            <div className="card-body">
            <h5 className="card-title">{stock.ticker}-{stock.id}</h5>
            <p className="card-text">${stock.currentPrice}</p>
            <p className="card-text">Purchased at: ${stock.purchasePrice}</p>
            <p className="card-text">{Math.round((stock.currentPrice/stock.purchasePrice - 1)*10000)/100}%</p>
            <p className="card-text">Quantity: {stock.quantity}</p>    
            </div>
            </div>
            </div>
            )}
            </div>
            </div>
            </div>
      )
  }

  function Buy(){
    const [haveStock, setValue] = useState(false);
        
    
        const onSubmit = (event) => {
            event.preventDefault(); 
            update(event);
            setUpdate(true);
        }
        const update = (event) => {
            event.preventDefault();
            idCount += 1;
            setID(idCount);
            setValue(true);
            fetch(`http://localhost:8081/getStock/${event.target[0].value}`)
            .then(response => response.json())
            .then(responseData => {
                var current = responseData.current;
                
                // Make the second fetch request here, within the scope of the first 'then' block
                fetch(`http://localhost:8081/buyStock/`, {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        "id": idCount,
                        "ticker": event.target[0].value,
                        "quantity": Number(event.target[1].value),
                        "purchasePrice": current,
                        "percentChange": 0
                    })
                });
            }); 
        };
        const toView = () => {
            setUpdate(false);
            (setViewer(0));}
    
        return (
            <div>
                {NavBar()}{MyComponent()}
                <div className="display-1">Buy Stock</div>
                <form onSubmit={onSubmit} className="container mt-5">
                    <div className="form-group">
                        <input name="ticker" placeholder="Ticker:" className="form-control"/>
                        <input name="quantity" placeholder="quantity:" className="form-control"/>
                        <button type="submit" className= "btn btn-primary">Buy Stock</button>
                        <button onClick={toView} className= "btn btn-primary">Back to View</button>
                        {haveStock && (
                    <div className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
                        <p>Stock added with ID: {id}!</p>
                    </div>
                )}
                    </div>
                </form> 
            </div>
        );
  }
  function Sell() {
    const [stock, setStock] = useState(null);
    const [haveStock, setValue] = useState(false);
    const [amount, setAmount] = useState(0);
    const[id, setID] = useState(0);

    const onSubmit = (event) => {
        event.preventDefault(); 
        fetch("http://localhost:8081/getPurchased/" + event.target[0].value)
        .then(response => response.json())
        .then(stock => {
            setAmount(Number(event.target[1].value));
            setStock(stock);
            setID(Number(event.target[0].value))
            setValue(true); 
        })
        .catch(error => console.error('Error:', error));
    }
    const onRemove = () => {
        if (amount >= stock.quantity){
            fetch(`http://localhost:8081/sellStock/${id}`, {
            method: 'DELETE',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(
            {"id":id}
            )
        })
        }
        else {
            fetch(`http://localhost:8081/sellPartial/${id}`, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(
            { "quantity": stock.quantity-amount}
            )
        })
        }
            setStock(null);
            setValue(false);
            setID(0);
    }
    const toView = () => {
        setUpdate(false);
        (setViewer(0));}

    return (
        <div>
            {NavBar()}
            {MyComponent()}
            <div className="display-1">Sell Stocks</div>
            <form onSubmit={onSubmit} className="container mt-5">
                <div className="form-group">
                    <input name="id" placeholder="ID #" className="form-control"/>
                    <input name="quantity" placeholder="quantity:" className="form-control"/>
                    <button type="submit" className= "btn btn-primary">Remove</button>
                    <button onClick={toView} className= "btn btn-primary">Back to View</button>
                </div>
            </form> 
            {haveStock && (
                <div key={stock.id} className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
                    <div className="card">
                        
                        <div className="card-body">
                            <h5 className="card-title">{stock.ticker}</h5>
                            <p className="card-text">{stock.purchasePrice}</p>
                            <p className="card-text">${stock.currentPrice}</p>
                            <p className="card-text">{stock.quantity}</p>
                        </div>
                    </div>
                    <button onClick={onRemove} className= "btn btn-primary">Sell Stock</button>
                </div>
            )}
        </div>
    );

   
}

const NavBar = () => {
    return (
      <div className="text-center">
        <button type='button' className='btn btn-danger m-4' onClick={e => { setViewer(0); setUpdate(!updated) }}>Home</button>
        <button type='button' className='btn btn-danger m-4' onClick={e => { setViewer(1); setUpdate(!updated) }}>Buy</button>
        <button type='button' className='btn btn-danger m-4' onClick={e => { setViewer(2); setUpdate(!updated) }}>Sell</button>
        <button type='button' className='btn btn-danger m-4' onClick={e => { setViewer(3); setUpdate(!updated) }}>About</button>
        <button type='button' className='btn btn-danger m-4' onClick={e => { setViewer(4); setUpdate(!updated) }}>My Stocks</button>
      </div>
    );
  };

function About() {
    const toView = () => {
      setUpdate(false);
      (setViewer(3));}

    return (
        
    
    <div>{NavBar()}{MyComponent()}<div className="display-1">About</div><div className="card">
    <div className="card-body">
        <h5 className="card-title">About the Authors</h5>
        <p>Keegan Moerke kmoerke@iastate.edu</p>
        <p>Kaden Neddermeyer knedderm@iastate.edu</p>
        <p>SECOMS 319 Construction of User Interfaces - Ali Janessari</p>
    </div>
  </div></div>);
}

return(<div>
  {viewer === 0 && <GetAllStocks/>}
  {viewer === 1 && <Buy/>}
  {viewer === 2 && <Sell/>}
  {viewer === 3 && <About/>}
  {viewer === 4 && <GetMyStocks/>}
</div>);
}

export default App