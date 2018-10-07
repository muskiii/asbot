'use strict';
const Q = require("q");
const http = require('http');
const https = require('https');

var exports = module.exports = {};

exports.get = function (opts) {
    var deferred = Q.defer();
    if(opts.indexOf("https") !== -1){
        https.get(opts, (res) => {
            console.log(opts);
            const { statusCode } = res;
            const contentType = res.headers['content-type'];
    
            let error;
            if (statusCode !== 200) {
                error = new Error('Request Failed.\n' +
                    `Status Code: ${statusCode}`);
            } else if (!/^application\/json/.test(contentType)) {
                error = new Error('Invalid content-type.\n' +
                    `Expected application/json but received ${contentType}`);
            }
            if (error) {
                console.error(error.message);
                // consume response data to free up memory
                res.resume();
                return;
            }
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                console.log("Data Recived");
                try {
                    const parsedData = JSON.parse(rawData);
                    deferred.resolve(parsedData);
                } catch (e) {
                    console.error(e.message);
                    deferred.reject(new Error("failure"));
                }
            });
        }).on('error', (e) => {
            console.error(`Got error: ${e.message}`);
            deferred.reject(new Error("failure"));
        });
    }else{
        http.get(opts, (res) => {
            console.log(opts);
            const { statusCode } = res;
            const contentType = res.headers['content-type'];
    
            let error;
            if (statusCode !== 200) {
                error = new Error('Request Failed.\n' +
                    `Status Code: ${statusCode}`);
            } else if (!/^application\/json/.test(contentType)) {
                error = new Error('Invalid content-type.\n' +
                    `Expected application/json but received ${contentType}`);
            }
            if (error) {
                console.error(error.message);
                // consume response data to free up memory
                res.resume();
                return;
            }
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                console.log("Data Recived");
                try {
                    const parsedData = JSON.parse(rawData);
                    deferred.resolve(parsedData);
                } catch (e) {
                    console.error(e.message);
                    deferred.reject(new Error("failure"));
                }
            });
        }).on('error', (e) => {
            console.error(`Got error: ${e.message}`);
            deferred.reject(new Error("failure"));
        });
    }
    

    return deferred.promise;
};

