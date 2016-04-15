var request = require('request');
var jsonfile = require('jsonfile');
var log4js = require('log4js');
var logger = log4js.getLogger('API-REQUESTER');
logger.setLevel('INFO');


request('http://localhost:3412/month-stream', function(error, response, body) {

    logger.info("Executed the API Request");

    if (!error && response && response.statusCode && response.statusCode == 200) {
        logger.info("Writing the Current file to be Analyzed");
        jsonfile.writeFile('data/prod/current.json', JSON.parse(body));
    } else if (!error && response && response.statusCode && response.statusCode != 200) {
        logger.error("API Error " + response.statusCode);
    } else if (error) {
        logger.error(error);
    }

});
