# Bigdata Flow

[![npmpackage](https://nodei.co/npm/bigdata-flow.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/bigdata-flow/)

Queue manager for data entry and editing with Redis and MongoDB for large data streams

## Install

```bash
$ npm install bigdata-flow
```

## Usage

Flow control initially inserts information into Redis that will be synchronized with MongoDB without forcing large amounts of data

```js
const BigdataFlow = require("bigdata-flow"),
      Flow = new BigdataFlow({
          mongodb: { url: "mongodb://localhost:27017", dbName: "flow" },
          redis: { host: "127.0.0.1", port: 6379 },
          actionsPerSecond: 1000
      });

Flow.then((flow) => {
    flow.synchronize();
}).catch((err) => {
    console.log(err);
});
```

After the configuration for connection with Redis and MongoDB the synchronize function performs the reading of the data registered in the maximum limit I define in the configuration 'actionsPerSecond', if the parameter is not configured the default value will be 1000 actions per second

## Insert

The insert function will synchronize with MongoDB using the 'insert' function there is also a function for update and insert and update (upsert)

```js
const crypto = require("crypto");

for(let i = 0; i < 100000; i++){
    flow.insert("mycollection", {
        hash: crypto.createHash('sha256').update(new Buffer(i), 'utf8').digest("hex")
    });
}
```

In the example above will be inserted 100,000 hash sequentially generated to popular Redis and synchronize with MongoDB according to the configured limit

## Update/Upsert

In the case of update and upsert the query parameter will be used to filter the records that must be changed

```js
const crypto = require("crypto");

for(let i = 0; i < 100000; i++){
    flow.upsert("mycollection", {
        hash: crypto.createHash('sha256').update(new Buffer(i), 'utf8').digest("hex")
    }, { lastmodified: new Date().getTime() });
}
```
