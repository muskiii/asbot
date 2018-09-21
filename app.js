const commando = require('discord.js-commando');
const YTDL = require('ytdl-core');
const httpClient = require('./services/httpClient');

const TOKEN = "NDg5ODU2NDc4OTc5NTU1MzI5.DnxBwg.4VJt_GYuzXcMc1zngU7imsQ8aWQ";
const PREFIX = ">";

const bot = new commando.Client();
var myMessage;

bot.registry.registerGroup('random', 'Random');
bot.registry.registerDefaults();
bot.registry.registerCommandsIn(__dirname + "/commands");

var servers = {};
var currentSurviv = "";
var survivURL = "http://surviv.io/";

dataobj = {"type":"create","data":{"roomData":{"roomUrl":"","region":"na","teamMode":4,"autoFill":true,"findingGame":false,"lastError":""},"playerData":{"name":"Rakuraku"}}};

var WebSocketClient = require('websocket').client;
 
var client = new WebSocketClient();
var myConnection;
client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});
 
client.on('connect', function(connection) {
    myConnection = connection;
    if(currentSurviv == "DISCONNECTED"){
        surviv();
    }
    console.log('WebSocket Client Connected');
    myConnection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    myConnection.on('close', function() {
        console.log('echo-protocol Connection Closed');
        client.connect('ws://surviv.io/team', 'echo-protocol');
        currentSurviv = "DISCONNECTED";        
    });
    myConnection.on('message', function(message) {
        if (message){
            message = JSON.parse(message.utf8Data);
            
            console.log("Received: '" + JSON.stringify(message)  +  "'");
            
            switch(message.type){
                case "state":
                    currentSurviv = message.data.room.roomUrl;
                    if(message.data.players.length > 1){
                        var kickOne = {"type": "kick", "data": {"playerId": 1}};
                        sendData({"type": "kick", "data": {"playerId": 1}});                        
                    }else{                        
                        myMessage.channel.send(survivURL + currentSurviv);
                    }
                break;
            }   
        }               
    });    
});

function sendData(data) {
    if (myConnection.connected) {
        console.log("mandando  data: " + JSON.stringify(data))
        myConnection.send(JSON.stringify(data));
    }
}

client.connect('ws://surviv.io/team', 'echo-protocol');


bot.on('message', (message) => {
    myMessage = message;

    if (message.author.equals(bot.user)) return;
    if (!message.content.startsWith(PREFIX)) return;

    var args = message.content.substring(PREFIX.length).split(" ");
    var survivCode = args[0].indexOf(survivURL) !== -1 ? args[0].substring(survivURL.length) : false;

    if (survivCode) {
        args = [];
        args.push("surviv");
        args.push(survivCode);
    }

    switch (args[0].toLowerCase()) {
        case "surviv-rank":
            return survivRank(message);

        case "surviv-est":
            return survivEst(args[1],message);

        case "surviv":
            return surviv();
        case "bye":
            message.channel.send("live long and prosper");
            break;

        case "play":
            return addSong(args[1], message);

        case "skip":
            var server = servers[message.guild.id];
            if (server.dispatcher) server.dispatcher.end();
            break;
        case "stop":
            var server = servers[message.guild.id];
            if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();
            break;
          
        case "test":
            return testFuckinEverything(message);
        default:
            message.channel.send("escribe bien imbecil");
    }

});

function testFuckinEverything(message){
    survivRank(message);
    survivEst("aspen",message);
    surviv(null,message);
    surviv(survivURL+"1234",message);
    addSong("https://www.youtube.com/watch?v=68ugkg9RePc", message);
    return;
}

function play(connection, message) {
    var server = servers[message.guild.id];
    server.dispatcher = connection.playStream(YTDL(server.queue[0], { quality: "highestaudio" }));
    server.queue.shift();
    server.dispatcher.on("end", function () {
        if (server.queue[0]) play(connection, message);
        else connection.disconnect();
    })
}

function getNasaStuff(message) {
    return httpClient.get('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
};

function getSurvivRank(users, message) {

    var aspen = getSurvivEst(users[0], message).then(function (data) {
        return data;
    });
    var raku = getSurvivEst(users[1], message).then(function (data) {
        return data;
    });
    var patoco = getSurvivEst(users[2], message).then(function (data) {
        return data;
    });

    Promise.all([aspen, raku, patoco]).then(values => {
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
        message.channel.send("The Master of the world is: " + winner + " with a KPG of: " + maxKpg + "\n" + loserList);
    });
    return;
};

function getSurvivEst(user) {
    return httpClient.get('http://surviv.io/api/user_stats?slug=' + user + '&interval=all');
};

function survivRank(message){
    var users = ["aspen", "zeep", "rakuraku"];
    return getSurvivRank(users, message);
}
function survivEst(user,message){
    if (!user) {
        message.channel.send("Ingresar usuario");
        return;
    }
    return getSurvivEst(user).then(value => {
        message.channel.send(value.username + " wins: " + value.wins
            + " kills: " + value.kills + " games: " + value.games + " kpg: " + value.kpg);
    });
}
function surviv(){
        if (myConnection.connected){
            sendData(dataobj);
        }else{            
            client.connect('ws://surviv.io/team', 'echo-protocol');
        }
        
}
function addSong(song,message){
    if (!song) {
        message.channel.send("link missing");
        return;
    }
    if (!message.member.voiceChannel) {
        message.channel.send("you must be in voice channel K-po");
        return;
    }
    if (!servers[message.guild.id]) {
        servers[message.guild.id] = {
            queue: []
        }
    }
    var server = servers[message.guild.id];
    server.queue.push(song);

    if (!message.guild.voiceConnection) {
        message.member.voiceChannel.join().then(function (connection) {
            play(connection, message);
        })
    }
}

bot.login(TOKEN);
