'use strict';
const botClient = require('./services/botClient').botClient;
var express = require('express');
var path = require('path');

const TOKEN = "NDg5ODU2NDc4OTc5NTU1MzI5.DnxBwg.4VJt_GYuzXcMc1zngU7imsQ8aWQ";

var app = express();

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function (req, res) {
  res.send('AsBot Madafaka');
});

app.listen(process.env.PORT || 5000, function () {
  console.log('App is up and running over port :' + process.env.PORT || 5000);
});


botClient.bot.login(TOKEN);
