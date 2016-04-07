var elasticsearch = require('elasticsearch');
var fs = require('fs');
var JSONStream = require('JSONStream');
var sentiment = require('sentiment');
var stream = fs.createReadStream('data/backup/stocktwits_messages_jan_2016.json', {
    encoding: 'utf8'
});
var i = 0;

var parser = JSONStream.parse();

var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'info'
});

stream.pipe(parser);

parser.on('data', function(obj) {
    i++;
    console.log(i);
    if (i == 1000) {
        stream.pause();
        console.log('paused');
        setTimeout(function(){
            console.log('resumed');
            i = 0;
            stream.resume();
        },1000);
    }
    var arr = [];
    console.log("read");
    var customSentiment = sentiment(obj.body);
    var newObj = {
        obj: obj,
        customSentiment: customSentiment
    }
    arr.push({ "index" : { "_index" : "jan_twits_newest", "_type" : "block", "_id" : obj.id } })
    arr.push(newObj);
    processLine(arr);
});




function processLine(line) { // here's where we do something with a line
    console.log("processing");


    client.bulk({
        requestTimeout: 300000000,
        body: line
    }, function(error, response) {
        if (error) {
            console.log('elasticsearch error: ' + error);
        }
    });

    console.log("record created " + line[1].obj.id);

}
