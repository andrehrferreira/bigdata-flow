/**
 * Bigdata Flow module application
 *
 * @author André Ferreira <andrehrf@gmail.com>
 */

'use strict';

const Redis = require("redis"),
      MongoClient = require("mongodb").MongoClient;

class BigdataFlow {
    /**
     * Contructor function
     * @return void
     */
    constructor (config){
        this.config = config;
        var self = this;

        return new Promise((resolve, reject) => {
            self.redis = Redis.createClient(config.redis);

            MongoClient.connect(config.mongodb.url, (err, client) => {
                if(err) reject(err)
                else {
                    self.mongodb = client.db(config.mongodb.dbName);
                    resolve(self);
                }
            });
        });
    }

    set (key, data) {
        if(typeof key == "string")
            this[key] = data;

        return this;
    }

    started () {
        return (typeof this.mongodb == "object" && typeof this.redis == "object");
    }

    insert (collection, data) {
        if(this.started()){
            this.redis.set(new Date().getTime() + process.hrtime(), JSON.stringify({
                collection: collection,
                type: "insert",
                data: data,
                createat: new Date().getTime()
            }), Redis.print);
        }
        else{
            console.log("Redis or MongoDB are not started correctly");
        }
    }

    update (collection, query, data) {
        if(this.started()){
            this.redis.set(new Date().getTime() + process.hrtime(), JSON.stringify({
                collection: collection,
                type: "update",
                query: query,
                data: data,
                createat: new Date().getTime()
            }), Redis.print);
        }
        else{
            console.log("Redis or MongoDB are not started correctly");
        }
    }

    upsert (collection, query, data) {
        if(this.started()){
            this.redis.set(new Date().getTime() + process.hrtime(), JSON.stringify({
                collection: collection,
                type: "upsert",
                query: query,
                data: data,
                createat: new Date().getTime()
            }), Redis.print);
        }
        else{
            console.log("Redis or MongoDB are not started correctly");
        }
    }

    synchronize () {
        setInterval((self) => {
            if(typeof self.keys != "object"){
                self.redis.send_command("KEYS", ["*"], (err, keys) => {
                    if(keys)
                        self.keys = keys;
                });
            }
            else{
                if(self.keys.length > 0){
                    var max = self.config.actionsPerSecond | 1000;

                    for(let i = 0; i < max; i++){
                        ((key) => {
                            if(self.keys.length > 0){
                                self.keys.shift();

                                self.redis.get(key, (err, raw) => {
                                    try{
                                        var data = JSON.parse(raw);

                                        switch(data.type){
                                            case "insert":
                                                self.mongodb.collection(data.collection).insert(data.data, (err) => {
                                                    if(err) console.log(err);
                                                    else self.redis.del(key);
                                                });
                                            break;
                                            case "update":
                                                self.mongodb.collection(data.collection).update(data.query, { $set: data.data }, (err) => {
                                                    if(err) console.log(err);
                                                    else self.redis.del(key);
                                                });
                                            break;
                                            case "update":
                                                self.mongodb.collection(data.collection).update(data.query, { $set: data.data }, { upsert : true }, (err) => {
                                                    if(err) console.log(err);
                                                    else self.redis.del(key);
                                                });
                                            break;
                                        }
                                    } catch(e){ console.log(e.message); }
                                });
                            }
                        })(self.keys[0])
                    }
                }
            }
        }, 1000, this);
    }
}

module.exports = BigdataFlow;
