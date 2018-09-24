'use strict';
const commando = require('discord.js-commando');
const httpClient = require('./httpClient');
const YTDL = require('ytdl-core');
const survivClient = require('./survivClient').survivClient;

const PREFIX = ">";

var servers = {};
var botClient  = {};
botClient.bot =  new commando.Client();

// botClient.bot.registry.registerGroup('random', 'Random'); 
// botClient.bot.registry.registerDefaults();
// botClient.bot.registry.registerCommandsIn(__dirname + "/commands");
botClient.bot.on('message', (message) => {
    global.myMessage = message;

    if (message.author.equals(botClient.bot.user)) return;
    if (!message.content.startsWith(PREFIX)) return;

    var args = message.content.substring(PREFIX.length).split(" ");

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
    // survivRank(message);
    // survivEst("aspen",message);
    // surviv(null,message);
    // surviv(survivURL+"1234",message);
    // addSong("https://www.youtube.com/watch?v=68ugkg9RePc", message);
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