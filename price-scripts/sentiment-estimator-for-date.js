var https = require('https');
var Twitter = require('twitter');
var client = new Twitter(require('./util/twitter-config.json'));

var keywords = ['$SXE', 'southcross',  'CGI Group', 'oberon associates', 'techrizon']
var value = '"' + keywords.join('" OR "') + '"';

getTweets(value, function(tweets) {
    console.log(tweets.length);

    var fs = require('fs-extra');
    fs.writeFileSync('tweets.json', JSON.stringify(tweets, null, 4), 'utf-8');
});

function getTweets(search, cb, collectiveTweets, sinceId) {
    var params = {q: search, count: 100};
    if (sinceId) {
        params.max_id = sinceId;
    }
    console.log('requesting with', params);
    client.get('search/tweets', params, function(err, body) {
        if (body.statuses.length === 0) {
            return cb(tweets);
        }
        if (!collectiveTweets) {
            collectiveTweets = body.statuses;
        }
        else {
            collectiveTweets = collectiveTweets.concat(body.statuses);
        }

        if (body.search_metadata.next_results) {
            var smallestId = parseNextId(body.search_metadata.next_results);
            if (smallestId !== sinceId) {
                getTweets(search, cb, collectiveTweets, smallestId)    
            }
            else {
                cb(tweets);
            }
            
        }
        else {
            cb(tweets);
        }
    });
}

function parseNextId(nextResults) {
    var identifier = 'max_id=';
    nextResults = nextResults.substring(nextResults.indexOf(identifier) + identifier.length);
    nextResults = nextResults.substring(0, nextResults.indexOf('&'));
    return nextResults;
}