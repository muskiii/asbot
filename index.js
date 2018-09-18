const commando = require('discord.js-commando');
const YTDL = require('ytdl-core');
const http = require('http');

const TOKEN = "NDg5ODU2NDc4OTc5NTU1MzI5.DnxBwg.4VJt_GYuzXcMc1zngU7imsQ8aWQ";
const PREFIX = ">";

const bot = new commando.Client();

bot.registry.registerGroup('random','Random');
bot.registry.registerDefaults();
bot.registry.registerCommandsIn(__dirname + "/commands");

var servers = {};
var currentSurviv = "";

bot.on('message',(message)=>{
    if(message.author.equals(bot.user)) return;

    if(!message.content.startsWith(PREFIX)) return;

    var args = message.content.substring(PREFIX.length).split(" ");
    
    var survivURL = "http://surviv.io/#";
    var survivCode = args[0].indexOf(survivURL) !== -1 ? args[0].substring(survivURL.length) : false;
    
    if (survivCode){
        args = [];
        args.push("surviv");
        args.push(survivCode);
    }


    switch(args[0].toLowerCase()){
        case "surviv-est":
        if(!args[1]){
            message.channel.send("Ingresar usuario");
            break;
        }
        return getSurvivEst(args[1],message);
        
        case "surviv":
            if(!args[1]){
                if(currentSurviv != ""){
                    message.channel.send(survivURL+currentSurviv);
                    break;
                }
                message.channel.send("No game in progress")
                break;
            }else{
                if (args[1].length <= 6){
                    currentSurviv = args[1];
                    message.channel.send(args[1] + " Saved");
                    break;
                }else{
                    message.channel.send("Codigo sospechoso");
                    break;
                }
            }        
        case "bye":
        message.channel.send("live long and prosper");
        break;

        case "play":
        if(!args[1]){
            message.channel.send("link missing");
            break;
        }

        if(!message.member.voiceChannel){
            message.channel.send("you must be in voice channel K-po");
            break;
        }

        if(!servers[message.guild.id]){            
            servers[message.guild.id] = {
                queue: []
            }
        }

        var server = servers[message.guild.id];
        server.queue.push(args[1]);

        if(!message.guild.voiceConnection){
            message.member.voiceChannel.join().then(function(connection){
                play(connection, message);
            })
        } 
        break;
        case "skip":
            var server = servers[message.guild.id];
            if(server.dispatcher) server.dispatcher.end();

            break;
        case "stop":
        var server = servers[message.guild.id];
        if(message.guild.voiceConnection) message.guild.voiceConnection.disconnect();
        
        break;
        default:
        message.channel.send("escribe bien imbecil");
    }

});

// function getForecast(){
    

// https.get('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', (resp) => {
//   let data = '';

// });
// }

// function getNasasStuff(){
//     request('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', { json: true }, (err, res, body) => {
//     if (err) { return console.log(err); }
//     console.log(body.url);
//     console.log(body.explanation);
//   });
// }

function play(connection, message){
    var server = servers[message.guild.id];
    server.dispatcher = connection.playStream(YTDL(server.queue[0],{quality: "highestaudio"}));

    server.queue.shift();

    server.dispatcher.on("end",function(){
        if(server.queue[0]) play(connection,message);
        else connection.disconnect();
    })
}
function getSurvivEst(user,message){
    return http.get('http://surviv.io/api/user_stats?slug=' + user + '&interval=all', (res) => {
        console.log('http://surviv.io/api/user_stats?slug=' + user + '&interval=all');
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
            if (parsedData != null){
                    message.channel.send(parsedData.username+ " wins: " + parsedData.wins 
                    + " kills: "+ parsedData.kills + " games: " + parsedData.games + " kpg: " + parsedData.kpg);   
                }  
            // console.log(parsedData);
            } catch (e) {
            console.error(e.message);
            }
        });
    }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
    });
};

bot.login(TOKEN);
