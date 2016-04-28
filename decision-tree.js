var jsonfile = require('jsonfile');
var ml = require('machine_learning');
var fs = require('fs');
var JSONStream = require('JSONStream');
var stream = fs.createReadStream('data/prod/current.json', {
    encoding: 'utf8'
});
var json2csv = require('nice-json2csv');
var _ = require('underscore');
var nodemailer = require('nodemailer');
var moment = require('moment');
var log4js = require('log4js');
var logger = log4js.getLogger('DECISION-TREE');
logger.setLevel('INFO');



var data = jsonfile.readFileSync('trainer/oct_dec_2015_indicators.json');
var result = jsonfile.readFileSync('trainer/oct_dec_2015_positions.json');

logger.info("Preparing Decision Tree");

var dt = new ml.DecisionTree({
    data: data,
    result: result
});

logger.info("Building Decision Tree");

dt.build();

logger.info("pruning decision tree");

dt.prune(1.0);


var parser = JSONStream.parse();

stream.pipe(parser);

parser.on('data', function(obj) {
    logger.info("Starting Read Stream");

    var processedLine = processLine(obj);
    var csvContent = json2csv.convert(processedLine.data);

    jsonfile.writeFile('output/' + moment().year() + '.' + moment().month() + '.' + moment().date() + '_output_data.json', processedLine.data);
    jsonfile.writeFile('output/' + moment().year() + '.' + moment().month() + '.' + moment().date() + '_output_stats.json', processedLine.stats);
    fs.writeFile('output_data.csv', csvContent);

    logger.info("Completed Streaming");

});


function processLine(line) { // here's where we do something with a line
    logger.info("Processing Stream");

    for (var i = 0; i < line.data.length; i++) {
        var arr = [];

        //arr.push(line.data[i].difference);
        //arr.push(line.data[i].countSlope);
        //arr.push(line.data[i].changeInSentimentSlope);
        //arr.push(line.data[i].countRatio);
        //arr.push(line.data[i].priceOnStartDate);
        //arr.push(line.data[i].endSentiment);
        arr.push(line.data[i].normalizedDifference);
        arr.push(line.data[i].normalizedCountSlope);
        arr.push(line.data[i].normalizedCountRatio);
        arr.push(line.data[i].normalizedSentimentSlope);

        var key = _.keys(dt.classify(arr));
        line.data[i].decision = key[0];

        if (line.data[i].decision == "short" && isToday(line.data[i].endDate) == true) {
            sendMail(line.data[i]);
            logger.info("Detected a Current Short Position " + line.data[i].ticker.toUpperCase() + " " + line.data[i].endDate + " ...Sending Mail");
        }
    };

    return line;
}

function sendMail(data) {
    // create reusable transporter object using the default SMTP transport
    var transporter = nodemailer.createTransport('smtps://akersh.srivastava%40tempest-ventures.com:thupddytzhokezbh@smtp.gmail.com');

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: '"Machine" <machine@tempest-ventures.com>', // sender address
        to: 'akersh.srivastava@tempest-ventures.com', // list of receivers
        subject: data.decision.toUpperCase() + ' ' + data.ticker.toUpperCase(), // Subject line
        text: 'Good Morning, ' +
            'I detected a ' + data.decision.toUpperCase() +
            ' position for ' + data.ticker.toUpperCase() + '.',
        html: 'Good Morning,<br><br>' +
            'I detected a ' + data.decision.toUpperCase() +
            ' position for ' + data.ticker.toUpperCase() + '.<br><br>' +
            '<br><b><u>Analysis Details<u></b><br>' +
            '<br><b>Difference:</b> ' + data.difference +
            '<br><b>Start Date:</b> ' + data.startDate +
            '<br><b>End Date:</b> ' + data.endDate +
            '<br><b>Start Sentiment:</b> ' + data.startSentiment +
            '<br><b>End Sentiment:</b> ' + data.endSentiment +
            '<br><b>Start Count:</b> ' + data.startCount +
            '<br><b>End Count:</b> ' + data.endCount +
            '<br><b>Count Ratio:</b> ' + data.countRatio +
            '<br><b>Count Slope:</b> ' + data.countSlope +
            '<br><b>Sentiment Slope:</b> ' + data.changeInSentimentSlope +
            '<br><br>Yours,<br>' +
            'Senti',
        attachments:[{
            filename: 'output_'+ moment().format("YYMMDD")+'.csv',
            path: 'output_data.csv'        }]
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            return logger.error(error);
        }
        logger.info('Message sent: ' + info.response);
    });
}

function isToday(endDate) {
        var dateDifference = moment(endDate, "YYYY/MM/DD").diff(moment(moment().format('YYYY/MM/DD'), "YYYY/MM/DD"));

        if ( dateDifference != 0) {
            return false;
        } else {
            return true;
        };
}
