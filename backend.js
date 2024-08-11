var express = require("express");
var cors = require("cors");
var app = express();
var bodyParser = require("body-parser");
app.use(cors());
app.use(bodyParser.json());
const port = "8081";
const host = "localhost";
app.listen(port, () => {
console.log("App listening at http://%s:%s", host, port);
});

const { MongoClient } = require("mongodb");
const url = "mongodb://127.0.0.1:27017";
const dbName = "FinalCS319";
const client = new MongoClient(url);
const db = client.db(dbName);

app.get("/allStocks", async (req, res) => {
    await client.connect();
    const query = {};
    const results = await db
    .collection("StockValues")
    .find(query)
    .limit(100)
    .toArray();
    res.status(200);
    res.send(results);
    })

app.get("/getStock/:ticker", async (req, res) => {
    const ticker = req.params.ticker;
    await client.connect();
    console.log("Node connected successfully to GET-id MongoDB");
    const query = {"ticker": ticker};
    const results = await db.collection("StockValues")
    .findOne(query);
    console.log("Results :", results);
    if (!results) res.send("Not Found").status(404);
    else res.send(results).status(200);
    });

app.get("/allPurchased", async (req, res) => {
    await client.connect();
    const query = {};
    const results = await db
    .collection("UserStocks")
    .find(query)
    .limit(100)
    .toArray();
    console.log(results);
    res.status(200);
    res.send(results);
    })

app.get("/getPurchased/:id", async (req, res) => {
    const id = req.params.id;
    await client.connect();
    console.log("Node connected successfully to GET-id MongoDB");
    const query = {"id": Number(id)};
    const results = await db.collection("UserStocks")
    .findOne(query);
    console.log("Results :", results);
    if (!results) res.send("Not Found").status(404);
    else res.send(results).status(200);
    });

app.post("/buyStock", async (req, res) => { 
    try {
        await client.connect();
        const keys = Object.keys(req.body);
        const values = Object.values(req.body);
        const newDocument = {
            "id": Number(values[0]), // It's possible for an individual to buy the same stock twice so tickers cannot be used for ID
            "ticker": values[1], 
            "purchasePrice": Number(values[3]), // stock price when purchased
            "currentPrice": Number(values[3]), // stock price currently (or when sold)
            "quantity": Number(values[2]), // how many stocks purchased
            "percentChange": Number(values[3])/Number(values[3]) // the change in price from purchase to current
            };
        console.log(newDocument);
        const results = await db.collection("UserStocks").insertOne(newDocument);
        res.status(200);
        res.send(results);
    }
    catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send({ error: 'An internal server error occurred' });
    }

});

app.delete("/sellStock/:id", async (req, res) => {
    try {
    const id = Number(req.params.id);
    await client.connect();
    const query = { "id": id };
    // delete
    const results = await db.collection("UserStocks").deleteOne(query);
    res.status(200);
    res.send(results);
    }
    catch (error){
    console.error("Error deleting robot:", error);
    res.status(500).send({ message: 'Internal Server Error' });
    }
});

// If the user tries to sell stocks less than the total amount purchased use put instead of delete.
app.put("/sellPartial/:id", async (req, res) => {
    const id = Number(req.params.id);
    const query = { "id": id };
    await client.connect();
    const currentQuantity = await db.collection("UserStocks").findOne(query).quantity;
    // Data for updating the document, typically comes from the request body
    const updateData = {
    $set:{
    "quantity": req.body.quantity
    }
    };
    // Add options if needed, for example { upsert: true } to create a document if it doesn't exist
    const options = { };
    const results = await db.collection("UserStocks").updateOne(query, updateData, options);
    if (results.matchedCount === 0) {
        return res.status(404).send({ message: 'Stock not found' });
    }
    res.status(200);
    res.send(results);
});

// Optional: If updating stocks values are used this will update all purchased stocks as well as the market stock's current value.
app.put("/priceUpdate/:ticker", async (req, res) => {
    const ticker = req.params.ticker;
    var newPrice = Number(Math.round(req.body.current*100)/100);
    const query = { "ticker": ticker };
    await client.connect();
    if (newPrice <= 0) {
        newPrice = await db.collection("StockValues").findOne(query).current;
    }
    // Data for updating the document, typically comes from the request body
    var updateData = {
    $set:{
    "currentPrice": Number(newPrice),
    }
    };
    // Add options if needed, for example { upsert: true } to create a document if it doesn't exist
    const options = { };
    const results = await db.collection("UserStocks").updateOne(query, updateData, options);
    var curr = await db.collection("StockValues").findOne(query);
    var high = curr.high;
    var low = curr.low;
    if (newPrice > high) high = newPrice;
    if (newPrice < low) low = newPrice;
    updateData = {
        $set:{
        "current": newPrice,
        "high": high,
        "low": low,
        "percentChange": newPrice/curr.purchasePrice
        }
        };
    await db.collection("StockValues").updateOne(query, updateData, options);
    res.status(200);
    res.send(results);
});

// Used to set the open value to the current value, same as updating the close
app.put("/close/:ticker", async(req, res) => {
    const query = {"ticker": req.params.ticker};
    const close = req.params.currentPrice;
    await client.connect();
    const updateData = {
        $set:{
        "open": close
        }
        };
    const options = { };
    const results = await db.collection("StockValues").update(query, updateData, options);
    await db.collection(StockValues).update(query, updateData, options);
    res.status(200);
    res.send(results);
})

