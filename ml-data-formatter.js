var fs = require('fs');
var JSONStream = require('JSONStream');
var stream = fs.createReadStream('data/oct_dec_2015(inProd)_updated.json', {
    encoding: 'utf8'
});
var _ = require('underscore');
var jsonfile = require('jsonfile');
var log4js = require('log4js');
var logger = log4js.getLogger('ML-DATA-FORMATTER');
logger.setLevel('INFO');


var parser = JSONStream.parse();

stream.pipe(parser);

parser.on('data', function(obj) {
    logger.info("Starting Read Stream");

    var processedData = processLine(obj);
    var positionArray = getPositionArray(processedData);
    var indicatorArray = getIndicatorArray(processedData, positionArray);

    logger.info("Writing Read Stream to File");

    jsonfile.writeFile('trainer/oct_dec_2015_positions.json', positionArray);
    jsonfile.writeFile('trainer/oct_dec_2015_indicators.json', indicatorArray);

    logger.info("Completed Write to File");

});




function processLine(line) { // here's where we do something with a line
    logger.info("Processing Lines");
    var dataArray = [];

    for (var i = 0; i < line.data.length; i++) {
        var arr = [];
        var profit = (line.data[i].priceOnEndDate - line.data[i].priceOnEndDate15) / line.data[i].priceOnEndDate;

        if (line.data[i].difference < 0 && profit < -0.40) {
            arr.push("short");
        } else {
            arr.push("do nothing");
        }

        //arr.push(line.data[i].difference);
        //arr.push(line.data[i].countSlope);
        //arr.push(line.data[i].changeInSentimentSlope);
        //arr.push(line.data[i].countRatio);
        //arr.push(line.data[i].priceOnStartDate);
        //arr.push(line.data[i].startSentiment);
        //arr.push(line.data[i].endSentiment);
        arr.push(line.data[i].normalizedDifference);
        arr.push(line.data[i].normalizedCountSlope);
        arr.push(line.data[i].normalizedCountRatio);
        arr.push(line.data[i].normalizedSentimentSlope);




        dataArray.push(arr);
    };

    return dataArray;

}


function getPositionArray(input) {
    var dataArray = [];

    for (var i = 0; i < input.length; i++) {
        dataArray.push(input[i][0]);
    }

    return dataArray;
}

function getIndicatorArray(input) {
    var dataArray = [];

    for (var i = 0; i < input.length; i++) {
        var arr = [];

        arr.push(input[i][1]);
        arr.push(input[i][2]);
        arr.push(input[i][3]);
        arr.push(input[i][4]);
        //arr.push(input[i][5]);



        dataArray.push(arr);
    }

    return dataArray;
}
