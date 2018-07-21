'use strict';

const crypto = require("crypto"),
      BigdataFlow = require("./index.js"),
      Flow = new BigdataFlow({
          mongodb: { url: "mongodb://localhost:27017", dbName: "flow" },
          redis: { host: "127.0.0.1", port: 6379 },
          actionsPerSecond: 1000
      });

Flow.then((flow) => {
    flow.synchronize();

    for(let i = 0; i < 10000; i++){
        flow.insert("coltest", {
            hash: crypto.createHash('sha256').update(new Buffer(i), 'utf8').digest("hex")
        });
    }
}).catch((err) => {
    console.log(err);
});
