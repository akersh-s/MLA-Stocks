var http = require('http-request');
var async = require('async');
var fs = require('fs-extra');

var funcs = [];

var startDate = new Date('3/9/2015');
var endDate = new Date('3/9/2016');
tickerSymbols.forEach(function(ticker) {
    var file = __dirname + '/../nasdaq-prices/' + ticker + '.json';
    if (!fs.existsSync(file)) {
        funcs.push(function(done) {
            //Don't get blocked
            setTimeout(function() {
            	console.log('Downloading ' + ticker);
                download(ticker, startDate, endDate, function(prices) {
                    if (prices) {
                        fs.writeFileSync(file, JSON.stringify(prices, null, 4), 'utf-8');
                    }

                    done(null, {});
                });
            }, 250);

        });
    }
});

async.series(funcs, function() {});

function download(ticker, startDate, endDate, cb) {

    var url = getUrl(ticker.replace(/\./g, '/'), startDate, endDate);
    console.log(url)
    http.get(url, function(err, res) {
        if (err) {
            console.error('An error happened while downloading ' + ticker);
            return cb(null);
        }
        var response = res.buffer.toString();
        var lines = response.split(/[\n\r]+/g);
        var isFirst = true;
        var values = {};
        lines.forEach(function(line) {
            if (isFirst) {
                isFirst = false;
                return;
            }
            try {
                var val = line.split(',');
                var date = val[0];
                var closePrice = val[4];
                values[date] = closePrice;
            } catch (e) {

            }

        });
        return cb(values);
    });
}


function getClosePriceForStockForDate(ticker, date, cb) {
    var url = getUrl(ticker, date, date);
    http.get(url, function(err, res) {
        if (err) {
            console.error(err);
            return;
        }
        var response = res.buffer.toString();
        var dateValues = response.split(/[\n\r]+/g)[1]
        var splitValues = dateValues.split(',');
        var closePrice = splitValues[4];
        console.log(ticker, closePrice);
        cb(closePrice);
    });
}




function getUrl(ticker, startDate, endDate) {
    var params = [];
    params.push('s=' + ticker);
    params.push('a=' + (startDate.getMonth()));
    params.push('b=' + startDate.getDate());
    params.push('c=' + startDate.getFullYear());

    params.push('d=' + (endDate.getMonth()));
    params.push('e=' + endDate.getDate());
    params.push('f=' + endDate.getFullYear());

    params.push('g=d');
    params.push('ignore=.csv');

    return 'http://ichart.finance.yahoo.com/table.csv?' + params.join('&');
}
//http://ichart.finance.yahoo.com/table.csv?s=GOOG&a=24&b=91&c=2013&d=25&e=91&f=2014&g=d&ignore=.csv
