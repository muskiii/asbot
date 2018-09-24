'use strict';

const httpClient = require('./httpClient');
var WebSocketClient = require('websocket').client;

var survivClient  = {};
survivClient.client = new WebSocketClient();
survivClient.survivURL = "http://surviv.io/";
survivClient.createJson = {"type":"create","data":{"roomData":{"roomUrl":"","region":"na","teamMode":4,"autoFill":false,"findingGame":false,"lastError":""},"playerData":{"name":"Rakuraku"}}};


survivClient.client.on('connect', function(connection) {
    survivClient.CuerrentConnection = connection;
    survivClient.sendData(survivClient.createJson);
    console.log('WebSocket Client Connected');
    survivClient.CuerrentConnection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    survivClient.CuerrentConnection.on('close', function() {
        survivClient.currentSurviv = undefined;
        console.log('echo-protocol Connection Closed');
        //survivClient.client.connect('ws://surviv.io/team', 'echo-protocol');
    });
    survivClient.CuerrentConnection.on('message', function(message) {
        if (message){
            message = JSON.parse(message.utf8Data);           
            console.log("Received: '" + JSON.stringify(message)  +  "'");
            
            switch(message.type){
                case "state":
                if(survivClient.currentSurviv == undefined || survivClient.currentSurviv !== message.data.room.roomUrl){
                    survivClient.currentSurviv = message.data.room.roomUrl;
                    console.log("reach: " + survivClient.survivURL + survivClient.currentSurviv);
                    myMessage.channel.send(survivClient.survivURL + survivClient.currentSurviv);
                }else{
                    if(message.data.players.length > 1){
                        // survivClient.client = {};
                        // var kickOne = {"type": "kick", "data": {"playerId": 1}};
                        // survivClient.client.disconnect(true);
                        // survivClient.sendData(kickOne);    
                        //survivClient.client.disconnect(true); //no funca                   
                    }
                }
                break;
            }   
        }               
    });    
});

survivClient.client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

survivClient.sendData = function (data) {
    if (survivClient.CuerrentConnection) {
        let json = JSON.stringify(data);
        console.log("Sending  data: " + json)
        survivClient.CuerrentConnection.send(json);
    }
}
survivClient.getSurvivEst = function (user) {
    return httpClient.get('http://surviv.io/api/user_stats?slug=' + user + '&interval=all');
};

survivClient.getSurvivRank = function (users) {

    var aspen = survivClient.getSurvivEst(users[0]).then(function (data) {
        return data;
    });
    var raku = survivClient.getSurvivEst(users[1]).then(function (data) {
        return data;
    });
    var patoco = survivClient.getSurvivEst(users[2]).then(function (data) {
        return data;
    });

    return Promise.all([aspen, raku, patoco]).then(values => {
        var maxKpg = 0;
        var winner = 0;
        var loserList = "Loser list: " + "\n";
        values.forEach(user => {
            if (user.kills > maxKpg) {
                maxKpg = user.kpg;
                winner = user.username;
            }
        });
        values.forEach(user => {
            if (winner !== user.username)
                loserList += user.username + "-" + user.kpg + "\n";
        });
        return "The Master of the world is: " + winner + " with a KPG of: " + maxKpg + "\n" + loserList;
    });    
};

survivClient.connect = function(){
    survivClient.client.connect('ws://surviv.io/team', 'echo-protocol');
}

exports.survivClient = survivClient;