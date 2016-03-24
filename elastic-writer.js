var elasticsearch = require('elasticsearch');
var fs = require('fs');
var JSONStream = require('JSONStream');
var sentiment = require('sentiment');
var stream = fs.createReadStream('stocktwits_messages_dec_2015.json', {encoding: 'utf8'});


var  parser = JSONStream.parse();

var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

stream.pipe(parser);

parser.on('data', function (obj) {
  console.log("read");
  var customSentiment = sentiment(obj.body);
  var newObj ={
    obj: obj,
    customSentiment: customSentiment
  }
  processLine(newObj);
});




function processLine(line) { // here's where we do something with a line
    console.log("processing");


            client.create({
              index: 'dec_twits',
              type: 'block',
              body: line
            }, function (error, response) {
              if (error) {
                console.log('elasticsearch error: ' + error);
              }            
            });
        
                console.log("record created");

}
