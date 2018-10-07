'use strict';
const commando = require('discord.js-commando');
const httpClient = require('./httpClient');
const YTDL = require('ytdl-core');
const survivClient = require('./survivClient').survivClient;

const PREFIX = ">";

var servers = {};
var botClient  = {};
botClient.bot =  new commando.Client();

botClient.bot.on('message', (message) => {
    global.myMessage = message;

    if (message.author.equals(botClient.bot.user)) return;
    if (!message.content.startsWith(PREFIX)) return;

    var args = message.content.substring(PREFIX.length).split(" ");

    switch (args[0].toLowerCase()) {
        case "light":
         return toggleLight().then(function(){
             message.send.channel("done");
         });
        case "nasa":
            return getNasaStuff().then(function(data){
                console.log(data);
                message.channel.send({embed: {
                    color: 3447003,                   
                    title: data.title,
                    image: {
                        url: data.hdurl
                      },
                    description: data.explanation,
                    timestamp: new Date(),
                    footer: {
                      text: "Aspen Rules"
                    }
                  }
                });
            });

        case "ip": 
            return myIp().then(function(data){
                console.log(data.ip);
                message.author.send(data.ip);
            });

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

function toggleLight(){
    return httpClient.get("http://181.164.95.251:9891/toggle");
}

function myIp() {
    return httpClient.get('https://api.ipify.org?format=json');
}

function getNasaStuff(message) {
    return httpClient.get('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
};

function survivRank(message){
    var users = ["aspen", "zeep", "rakuraku"];
    survivClient.getSurvivRank(users).then(function (value){message.channel.send(value)});
}
function survivEst(user,message){
    if (!user) {
        message.channel.send("Ingresar usuario");
        return;
    }
    return survivClient.getSurvivEst(user).then(value => {
        message.channel.send(value.username + " wins: " + value.wins
            + " kills: " + value.kills + " games: " + value.games + " kpg: " + value.kpg);
    });
}

function surviv(){
    survivClient.connect();
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
exports.botClient = botClient;