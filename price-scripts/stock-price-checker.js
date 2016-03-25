var stockPriceChecker = module.exports = {};
var http = require('http');

//Private Functions
var createMeaningfulQuotePropertyNames = function(data) {
    var quotes = {};
    data.forEach(function(googleQuote) {
        var quote = Infinity;
        if (googleQuote.l_cur && !isNaN(parseFloat(googleQuote.l_cur))) {
            quote = parseFloat(googleQuote.l_cur);
        } else if (googleQuote.l_fix && !isNaN(parseFloat(googleQuote.l_fix))) {
            quote = parseFloat(googleQuote.l_fix);
        }
        if (googleQuote.t) {
            var ticker = googleQuote.t.toLowerCase();
            quotes[ticker] = quote;
        }
    });
    return quotes;
};


stockPriceChecker.downloadPrices = function(tickerSymbols, cb) {
    var q = tickerSymbols.join(',');
    console.log('http://www.google.com/finance/info?q=' + q);
    http.get('http://www.google.com/finance/info?q=' + q, function(res) {
        var chunks = [];
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            if (chunk) {
                chunks.push(chunk);
            }
        });
        res.on('end', function() {
            var data = [];
            if (chunks.length > 0) {
                data = chunks.join();
                data = data.substring(3).replace(/[\n\r\t\s]/g, '').trim();

                //Fix weird google json syntax errors
                data = data.replace(/:,/g, ':"",').replace(/,,/g, ',').replace(/,:/g, ':');
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    stockPriceChecker.downloadPrices(tickerSymbols, cb);
                    return;
                }
                data = createMeaningfulQuotePropertyNames(data);
            }
            cb(data);
        });
    }).on('error', function(err) {
        console.log('Got error downloading prices: ' + err);
    });
};
