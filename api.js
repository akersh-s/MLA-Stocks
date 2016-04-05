var elasticsearch = require('elasticsearch');
var express = require('express');
var app = express();
var Q = require('q');
var _ = require('underscore');
var _ = require('lodash');
var stats = require("stats-lite");
var moment = require('moment');


var client = new elasticsearch.Client({
    host: 'localhost:9200'
});

app.get('/month-stream', function(req, res) {
    Q(streamSearch()).then(function(data) {

        res.json(data);
    });
});

app.get('/month', function(req, res) {
    Q(search()).then(function(data) {
        var processedData = pump(data);
        var sortedData = _.sortBy(processedData, 'difference');
        var statsDifference = getStatsDifference(sortedData);
        var statsCountRatio = getStatsCountRatio(sortedData);
        var statsCountSlope = getStatsCountSlope(sortedData);
        var statsSentimentSlope = getStatsSentimentSlope(sortedData);

        var stats = {
            "difference": statsDifference,
            "countSlope": statsCountSlope,
            "sentimentSlope": statsSentimentSlope,
            "countRatio": statsCountRatio
        };

        var data = compareStats(sortedData, stats);

        var output = {
            "stats": stats,
            "data": data
        };

        res.json(output);
        //res.json(data);
    });
});

app.get('/ticker', function(req, res) {
    Q(search()).then(function(data) {
        var processedData = pump(data);
        var sortedData = _.sortBy(processedData, 'endDate');
        var groupedData = _.groupBy(sortedData, 'ticker');

        var output = [];

        for (var i = 0; i < Object.keys(groupedData).length; i++) {
            var obj = groupedData;
            var stock = Object.getOwnPropertyNames(obj)[i];

            var chunk = {
                "ticker": stock,
                "block": {
                    "stats": {
                        "difference": getStatsDifference(obj[Object.getOwnPropertyNames(obj)[i]]),
                        "endCount": getStatsEndCount(obj[Object.getOwnPropertyNames(obj)[i]])
                    },
                    "data": obj[Object.getOwnPropertyNames(obj)[i]]
                }
            };

            output.push(chunk);
        }

        res.json(output);
        //res.json(data);
    });
});

app.get('/day', function(req, res) {
    Q(search()).then(function(data) {
        var processedData = pump(data);
        var sortedData = _.sortBy(processedData, 'changeInSentimentSlope');
        var groupedData = _.groupBy(sortedData, 'endDate');
        var output = [];

        for (var i = 0; i < Object.keys(groupedData).length; i++) {
            var obj = groupedData;
            var date = Object.getOwnPropertyNames(obj)[i];
            var statsDifference = getStatsDifference(obj[Object.getOwnPropertyNames(obj)[i]]);
            var data = obj[Object.getOwnPropertyNames(obj)[i]];

            var chunk = {
                "date": date,
                "block": {
                    "stats": {
                        "difference": statsDifference
                    },
                    "data": compareStats(data, statsDifference)
                }
            };

            output.push(chunk);
        }

        res.json(output);
    });
});

client.ping({
    requestTimeout: 30000,

    // undocumented params are appended to the query string
    hello: "elasticsearch"
}, function(error) {
    if (error) {
        console.error('elasticsearch cluster is down!');
    } else {
        console.log('All is well');
    }
});

var streamSearch = function() {
    var test = client.search({
        index: 'stream_twits',
        type: 'block',
        from: 0,
        body: {
            "aggs": {
                "posts_over_days": {
                    "date_histogram": {
                        "field": "created_at",
                        "interval": "day",
                        "format": "yyyy-MM-dd"
                    },
                    "aggs": {
                        "group_by_stock": {
                            "terms": {
                                "field": "symbols.symbol",
                                "order": {
                                    "sum_of_sentiment": "asc"
                                },
                                "size": 1000000
                            },
                            "aggs": {
                                "sum_of_sentiment": {
                                    "sum": {
                                        "field": "customSentiment.score"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    return test;
}

var search = function() {
    var test = client.search({
        index: 'nov_twits_2',
        type: 'block',
        from: 0,
        body: {
            "aggs": {
                "posts_over_days": {
                    "date_histogram": {
                        "field": "obj.object.postedTime",
                        "interval": "day",
                        "format": "yyyy-MM-dd"
                    },
                    "aggs": {
                        "group_by_stock": {
                            "terms": {
                                "field": "obj.entities.symbols.symbol",
                                "order": {
                                    "sum_of_sentiment": "asc"
                                },
                                "size": 1000000
                            },
                            "aggs": {
                                "sum_of_sentiment": {
                                    "sum": {
                                        "field": "customSentiment.score"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    return test;
}

var compareStats = function(data, stats) {

    for (var i = 0; i < data.length; i++) {
        data[i].normalizedCountSlope = (data[i].countSlope - stats.countSlope.min) / (stats.countSlope.max - stats.countSlope.min);
        data[i].normalizedSentimentSlope = (data[i].changeInSentimentSlope - stats.sentimentSlope.min) / (stats.sentimentSlope.max - stats.sentimentSlope.min);
        data[i].normalizedDifference = (data[i].difference - stats.difference.min) / (stats.difference.max - stats.difference.min);
        data[i].normalizedCountRatio = (data[i].countRatio - stats.countRatio.min) / (stats.countRatio.max - stats.countRatio.min)
    }

    return data;
}


var getStatsDifference = function(data) {
    var data = data;
    var cleanedData = _.pluck(data, 'difference');
    var output = {
        "mean": stats.mean(cleanedData),
        "median": stats.median(cleanedData),
        "mode": stats.mode(cleanedData),
        "variance": stats.variance(cleanedData),
        "stdev": stats.stdev(cleanedData),
        "1percentile": stats.percentile(cleanedData, 0.01),
        "min": _.min(cleanedData),
        "max": _.max(cleanedData)

    };

    return output;
}

var getStatsEndCount = function(data) {
    var data = data;
    var cleanedData = _.pluck(data, 'endCount');
    var output = {
        "mean": stats.mean(cleanedData),
        "median": stats.median(cleanedData),
        "mode": stats.mode(cleanedData),
        "variance": stats.variance(cleanedData),
        "stdev": stats.stdev(cleanedData),
        "99percentile": stats.percentile(cleanedData, 0.99),
        "min": _.min(cleanedData),
        "max": _.max(cleanedData)

    };

    return output;
}

var getStatsCountRatio = function(data) {
    var data = data;
    var cleanedData = _.pluck(data, 'countRatio');
    var output = {
        "mean": stats.mean(cleanedData),
        "median": stats.median(cleanedData),
        "mode": stats.mode(cleanedData),
        "variance": stats.variance(cleanedData),
        "stdev": stats.stdev(cleanedData),
        "99percentile": stats.percentile(cleanedData, 0.99),
        "min": _.min(cleanedData),
        "max": _.max(cleanedData)

    };

    return output;
}

var getStatsCountSlope = function(data) {
    var data = data;
    var cleanedData = _.pluck(data, 'countSlope');
    var output = {
        "mean": stats.mean(cleanedData),
        "median": stats.median(cleanedData),
        "mode": stats.mode(cleanedData),
        "variance": stats.variance(cleanedData),
        "stdev": stats.stdev(cleanedData),
        "99percentile": stats.percentile(cleanedData, 0.99),
        "min": _.min(cleanedData),
        "max": _.max(cleanedData)

    };

    return output;
}


var getStatsSentimentSlope = function(data) {
    var data = data;
    var cleanedData = _.pluck(data, 'changeInSentimentSlope');
    var output = {
        "mean": stats.mean(cleanedData),
        "median": stats.median(cleanedData),
        "mode": stats.mode(cleanedData),
        "variance": stats.variance(cleanedData),
        "stdev": stats.stdev(cleanedData),
        "99percentile": stats.percentile(cleanedData, 0.99),
        "min": _.min(cleanedData),
        "max": _.max(cleanedData)

    };

    return output;
}

var keys = function(data) {
    var output = [];
    var data = data;

    for (var i = 0; i < data.aggregations.posts_over_days.buckets.length; i++) {
        var pluckedKey = _.pluck(data.aggregations.posts_over_days.buckets[i].group_by_stock.buckets, "key");
        output.push(pluckedKey);
    }
    return _.uniq(_.flatten(output));
}

var result = function(key, data) {
    var output = [];
    var data = data;

    for (var i = 0; i < data.aggregations.posts_over_days.buckets.length; i++) {
        var match = _.where(data.aggregations.posts_over_days.buckets[i].group_by_stock.buckets, {
            "key": key
        });

        if (!(_.isEmpty(match))) {
            var obj = {
                "date": data.aggregations.posts_over_days.buckets[i].key_as_string,
                "obj": match
            };
            output.push(obj);
        }
    }

    return output;
};

var subtract = function(obj) {

    var block = [];

    if (obj && obj[0] && obj.length > 1) {
        for (var i = 0; i < (obj.length - 1); i++) {
            var startDate = obj[i].date;
            var endDate = obj[i + 1].date;
            var deltaSentiment = obj[i + 1].obj[0].sum_of_sentiment.value - obj[i].obj[0].sum_of_sentiment.value;

            var output = {
                "difference": deltaSentiment,
                "startDate": startDate,
                "startSentiment": obj[i].obj[0].sum_of_sentiment.value,
                "endSentiment": obj[i + 1].obj[0].sum_of_sentiment.value,
                "endDate": endDate,
                "ticker": obj[i].obj[0].key,
                "startCount": obj[i].obj[0].doc_count,
                "endCount": obj[i + 1].obj[0].doc_count,
                "countRatio": obj[i + 1].obj[0].doc_count / obj[i].obj[0].doc_count,
                "countSlope": (obj[i].obj[0].doc_count - obj[i + 1].obj[0].doc_count) / (moment.utc(moment(endDate, "YYYY/MM/DD").diff(moment(startDate, "YYYY/MM/DD"))).format("DD") - 1),
                "changeInSentimentSlope": deltaSentiment / (moment.utc(moment(endDate, "YYYY/MM/DD").diff(moment(startDate, "YYYY/MM/DD"))).format("DD") - 1)
            };

            block.push(output);
        }
    } else if (obj && obj[0]) {
        var output = {
            "difference": obj[0].obj[0].sum_of_sentiment.value,
            "startDate": obj[0].date,
            "endDate": "N/A",
            "startSentiment": obj[0].obj[0].sum_of_sentiment.value,
            "endSentiment": obj[0].obj[0].sum_of_sentiment.value,
            "ticker": obj[0].obj[0].key,
            "startCount": obj[0].obj[0].doc_count,
            "endCount": obj[0].obj[0].doc_count,
            "countRatio": "N/A",
            "countSlope": "N/A",
            "changeInSentimentSlope": "N/A"
        };
        block.push(output);
    } else {
        return;
    };



    return block;
};


var pump = function(data) {
    var data = data;
    var keysArray = keys(data);
    var output = [];

    for (var i = 0; i < keysArray.length; i++) {
        var block = subtract(result(keysArray[i], data), data);
        if (block) {
            for (n = 0; n < block.length; n++) {
                output.push(block[n]);
            }
        }
    };

    return output;
}


app.listen(process.env.PORT || 3412);
