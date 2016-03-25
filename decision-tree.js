// Reference : 'Programming Collective Intellignece' by Toby Segaran.
var jsonfile = require('jsonfile');
var ml = require('machine_learning');
var fs = require('fs');
var JSONStream = require('JSONStream');
var stream = fs.createReadStream('data/jan_2016_updated.json', {encoding: 'utf8'});
var _ = require('underscore');


var data = jsonfile.readFileSync('trainer/nov_2015_indicators.json');
var result = jsonfile.readFileSync('trainer/nov_2015_positions.json');

console.log("preparing decision tree");

var dt = new ml.DecisionTree({
    data : data,
    result : result
});

console.log("building decision tree");

dt.build();

console.log("pruning decision tree");

dt.prune(1.0);

 
var  parser = JSONStream.parse();

stream.pipe(parser);

parser.on('data', function (obj) {
	console.log("starting");

    var processedLine = processLine(obj);

	jsonfile.writeFile('output_data.json', processedLine.data);
    jsonfile.writeFile('output_stats.json', processedLine.stats);

    console.log("complete");

});




function processLine(line) { // here's where we do something with a line
    console.log("processing");

    for (var i = 0; i < line.data.length; i++){
    	var arr = [];
        arr.push(line.data[i].difference);
    	arr.push(line.data[i].countSlope);
        arr.push(line.data[i].changeInSentimentSlope);
    	//arr.push(line.data[i].priceOnStartDate);
        //arr.push(line.data[i].endSentiment);
    	var key = _.keys(dt.classify(arr));
    	line.data[i].decision = key[0];
    };

    return line;
}