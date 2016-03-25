var fs = require('fs-extra');
var cache = {};
var reported = [];
var monthYear = 'dec_2015';
var json = JSON.parse(fs.readFileSync(__dirname + '/../month_' + monthYear + '.json'));
/*
{ difference: -66,
  startDate: '2015-10-14',
  startSentiment: 56,
  endSentiment: -10,
  endDate: '2015-10-16',
  ticker: 'nflx',
  startCount: 47,
  endCount: 21,
  countSlope: 13,
  changeInSentimentSlope: -33 }

  "priceOnEndDate": 24.33, //this is the price on endDate
"priceOnEndDate3": 25, //this is the price on the date, 3 days after endDate
"priceOnEndDate7": 35, //this is the price on the date, 7 days after endDate
"priceOnEndDate15": 34, //this is the price on the date, 15 days after endDate
"priceOnEndDate30": 44 //this is the price on the date, 30 days after endDate

*/
var newData = [];
json.data.forEach(function(item) {
    var startDate = new Date(item.startDate.replace(/-/g, '/'));
    var endDate = new Date(item.endDate.replace(/-/g, '/'));
    var ticker = item.ticker;
    if (isValidDate(startDate) && isValidDate(endDate)) {
        var newItem = copy(item);
        newItem.priceOnStartDate = lookupPrice(ticker, startDate, 0, newItem);
        newItem.priceOnEndDate = lookupPrice(ticker, endDate, 0);
        newItem.priceOnEndDate3 = lookupPrice(ticker, endDate, 3);
        newItem.priceOnEndDate15 = lookupPrice(ticker, endDate, 15);
        newItem.priceOnEndDate30 = lookupPrice(ticker, endDate, 30);

        if (!newItem.priceOnStartDate || !newItem.priceOnEndDate || !newItem.priceOnEndDate30) {
            console.log('throwing out ' + ticker + ' - ' + startDate);
            return;  
        }
        newData.push(newItem);
    }


});
json.data = newData;

fs.writeFileSync(__dirname + '/../' + monthYear  +'_updated.json', JSON.stringify(json, null, 4), 'utf-8');




function formatDate(date) {
    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).replace(/0+/g, '0');
    month = month.substring(month.length - 2);
    var day = ('0' + date.getDate()).replace(/0+/g, '0');
    day = day.substring(day.length - 2);

    return [year, month, day].join('-');
}

function determineDate(date, n) {
    if (n === 0) {
        return date;
    }
    var oneDay = 1000 * 60 * 60 * 24;
    var sellDate = new Date(+date + (oneDay * n)); //n days later.

    while (sellDate.getDay() === 0 || sellDate.getDay() === 6) {
        sellDate = new Date(+sellDate + oneDay);
    }
    return sellDate;
}


function lookupPrice(ticker, date, n, newItem) {
    try {
        if (!cache[ticker]) {
            cache[ticker] = JSON.parse(fs.readFileSync(__dirname + '/../prices/' + ticker.toUpperCase() + '.json', 'utf-8'));
        }

        var formattedDate = formatDate(determineDate(date, n));
        while (!cache[ticker][formattedDate]) {
            n = n + 1;
            
            formattedDate = formatDate(determineDate(date, n));
            if (n > 40) {
                return null;
            }
        }
        return parseFloat(cache[ticker][formattedDate]);
    } catch (e) {
        if (reported.indexOf(ticker) === -1) {
            reported.push(ticker);
        }

        return null;
    }

}

function isValidDate(d) {
    if (Object.prototype.toString.call(d) !== "[object Date]")
        return false;
    return !isNaN(d.getTime());
}

function copy(input) {
    return JSON.parse(JSON.stringify(input));
}