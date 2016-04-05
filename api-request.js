var request = require('request');
var jsonfile = require('jsonfile');


request('http://localhost:3412/month', function(error, response, body) {

    console.log("executed the api request");

    if (!error && response.statusCode == 200) {
        console.log("writing the current file to be analyzed");
        jsonfile.writeFile('data/prod/current.json', JSON.parse(body));
    }

});
