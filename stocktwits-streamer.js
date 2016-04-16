var http = require('http');
var request = require('request');
var elasticsearch = require('elasticsearch');
var sentiment = require('sentiment');
var log4js = require('log4js');
var logger = log4js.getLogger('ST-STREAMER');
logger.setLevel('INFO');

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
        if (!error) {
            logger.info('Processing');
            var messages = JSON.parse(response.body).messages;
            processResponse(messages);
        } else if (error) {
            logger.error(error);
        } else {
            logger.error('Unknown operation');
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
    logger.info("Record Prepared");

    client.create({
        index: 'stream_twits',
        type: 'block',
        id: line.obj.id,
        body: line
    }, function(error, response) {
        if (error && error.displayName == "Conflict") {
            logger.info(error.displayName);
        } else if (error) { 
            logger.error(error.message);
        } else {
            logger.info('New Record Created');
        }
    });
}
