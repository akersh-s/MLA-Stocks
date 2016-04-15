var elasticsearch = require('elasticsearch');
var fs = require('fs');
var JSONStream = require('JSONStream');
var sentiment = require('sentiment');
var stream = fs.createReadStream('data/backup/stocktwits_messages_jan_2016.json', {
    encoding: 'utf8'
});
var log4js = require('log4js');
var logger = log4js.getLogger('ES-WRITER');
logger.setLevel('INFO');


var parser = JSONStream.parse();

var client = new elasticsearch.Client({
    host: 'localhost:9200'
});

stream.pipe(parser);

parser.on('data', function(obj) {
    logger.info("Reading...");
    var customSentiment = sentiment(obj.body);
    var newObj = {
        obj: obj,
        customSentiment: customSentiment
    }
    processLine(newObj);
});




function processLine(line) { // here's where we do something with a line
    logger.info("Processing...");


    client.create({
        requestTimeout: 1000000000000,
        index: 'test123',
        type: 'block',
        body: line
    }, function(error, response) {
        if (error) {
            logger.error(error);
        }
    });

    logger.info("Record Created...");

}
