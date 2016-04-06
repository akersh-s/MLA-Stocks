var http = require('http');
var request = require('request');
var elasticsearch = require('elasticsearch');
var sentiment = require('sentiment');


var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'info'
});


setInterval(function() {
    request({
        url: "https://api.stocktwits.com/api/2/streams/all.json?access_token=ccb597316f73655b16a105e9006330bd37272b81",
        method: "GET",
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 10
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log('sucess!');
            var messages = JSON.parse(response.body).messages;
            processResponse(messages);
        } else {
            console.log('error' + response.statusCode);
        }
    });
}, 10000);


function processResponse(messages) {
    for (var i = 0; i < messages.length; i++) {
        var obj = messages[i];

        var customSentiment = sentiment(obj.body);
        var newObj = {
            obj: obj,
            customSentiment: customSentiment
        }

        processLine(newObj);
    }
}


function processLine(line) {
    console.log("processing");

    client.create({
        index: 'stream_twits',
        type: 'block',
        id: line.obj.id,
        body: line
    }, function(error, response) {
        if (error) {
            console.log('elasticsearch error' + error.message);
        } else {
            console.log('record created');
        }
    });
}
