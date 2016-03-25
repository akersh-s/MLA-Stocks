var twitter = new require('twitter')(require('./util/twitter-config.json'));
var isStockMarketOpen = require('./util/stock-market-util').isStockMarketOpen;
var stockPriceChecker = require('./stock-price-checker');
var fs = require('fs');
var path = require('path');
var async = require('async');
var tweets = [];
twitter.stream('statuses/sample', {
    language: 'en'
}, function(stream) {
    stream.on('data', function(twitterData) {
        if (twitterData && twitterData.text && isStockMarketOpen()) {
            if (tweets.length >= 10000) {
            	var loc = path.join(__dirname, '..', 'data', +new Date() + '.json');
            	fs.writeFile(loc, JSON.stringify(tweets));
            	tweets = [];
            }
            else {
            	tweets.push(twitterData.text);
            }
            
        }
    });
});

