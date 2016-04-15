var elasticsearch = require('elasticsearch');
var fs = require('fs');
var JSONStream = require('JSONStream');
var sentiment = require('sentiment');
var stream = fs.createReadStream('data/backup/stocktwits_messages_dec_2015.json', {
    encoding: 'utf8'
});
var log4js = require('log4js');
var logger = log4js.getLogger('ES-BULK');
logger.setLevel('INFO');

var i = 0;

var parser = JSONStream.parse();

var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'info'
});

stream.pipe(parser);

parser.on('data', function(obj) {
    i++;
    if (i == 1000) {
        stream.pause();
        logger.info('Stream Paused at ' + i);
        setTimeout(function(){
            logger.info('Stream Reset at' + i);
            i = 0;
            stream.resume();
        },1000);
    }
    var arr = [];
    logger.info("Stream Read at " + i);
    var customSentiment = sentiment(obj.body);
    var newObj = {
        obj: obj,
        customSentiment: customSentiment
    }
    arr.push({ "index" : { "_index" : "testbulk", "_type" : "block", "_id" : obj.id } })
    arr.push(newObj);
    processLine(arr);
});




function processLine(line) { // here's where we do something with a line
    logger.info("Processing Record...");


    client.bulk({
        requestTimeout: 300000000,
        body: line
    }, function(error, response) {
        if (error) {
            logger.error(error);
        }
    });

    logger.info("Record Created: " + line[1].obj.id);

}
