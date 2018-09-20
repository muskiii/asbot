const commando = require('discord.js-commando');
const YTDL = require('ytdl-core');
const http = require('http');
const Q = require("q");

const TOKEN = "NDg5ODU2NDc4OTc5NTU1MzI5.DnxBwg.4VJt_GYuzXcMc1zngU7imsQ8aWQ";
const PREFIX = ">";

const bot = new commando.Client();

bot.registry.registerGroup('random', 'Random');
bot.registry.registerDefaults();
bot.registry.registerCommandsIn(__dirname + "/commands");

var servers = {};
var currentSurviv = "";
var survivURL = "http://surviv.io/#";

bot.on('message', (message) => {
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
            var users = ["aspen", "zeep", "rakuraku"];
            return getSurvivRank(users, message);

        case "surviv-est":
            if (!args[1]) {
                message.channel.send("Ingresar usuario");
                break;
            }
            return getSurvivEst(args[1]).then(value => {
                message.channel.send(value.username + " wins: " + value.wins
                    + " kills: " + value.kills + " games: " + value.games + " kpg: " + value.kpg);
            });

        case "surviv":
            if (!args[1]) {
                if (currentSurviv != "") {
                    message.channel.send(survivURL + currentSurviv);
                    break;
                }
                message.channel.send("No game in progress")
                break;
            } else {
                if (args[1].length <= 6) {
                    currentSurviv = args[1];
                    message.channel.send(args[1] + " Saved");
                    break;
                } else {
                    message.channel.send("Codigo sospechoso");
                    break;
                }
            }
        case "bye":
            message.channel.send("live long and prosper");
            break;

        case "play":
            if (!args[1]) {
                message.channel.send("link missing");
                break;
            }

            if (!message.member.voiceChannel) {
                message.channel.send("you must be in voice channel K-po");
                break;
            }

            if (!servers[message.guild.id]) {
                servers[message.guild.id] = {
                    queue: []
                }
            }

            var server = servers[message.guild.id];
            server.queue.push(args[1]);

            if (!message.guild.voiceConnection) {
                message.member.voiceChannel.join().then(function (connection) {
                    play(connection, message);
                })
            }
            break;
        case "skip":
            var server = servers[message.guild.id];
            if (server.dispatcher) server.dispatcher.end();

            break;
        case "stop":
            var server = servers[message.guild.id];
            if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();

            break;
        default:
            message.channel.send("escribe bien imbecil");
    }

});



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
    return httpGet('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
};

function getSurvivRank(users, message) {

    // var header = "+--------------------------+------------+-------------+------------+------------+\n"+
    // "|                          |    wins    |    kills    |    games   |    kpg     |\n"+
    // "+--------------------------+------------+-------------+------------+------------+\n";

    // var pattrn = "|                          |            |             |            |            |\n"+
    // "+--------------------------+------------+-------------+------------+------------+\n";
    // var entry = pattrn;
    // var replace = "^(?:[^|\/s]*\|){"+1+"}([^\/s]{"+user.username.length+"})"
    // var re = new RegExp(replace);
    // pattrn.replace(re, user.username);
    // header += pattrn;         

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
    return httpGet('http://surviv.io/api/user_stats?slug=' + user + '&interval=all');
};


var httpGet = function (opts) {
    var deferred = Q.defer();
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

    return deferred.promise;
};

bot.login(TOKEN);
