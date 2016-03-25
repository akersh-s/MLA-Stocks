var fs = require('fs-extra');
var path = require('path');
var pricesDir = path.join(__dirname, '..', 'prices');

var allData = {};
var dates = '10/1/2015,10/2/2015,10/5/2015,10/6/2015,10/7/2015,10/8/2015,10/9/2015,10/12/2015,10/13/2015,10/14/2015,10/15/2015,10/16/2015,10/19/2015,10/20/2015,10/21/2015,10/22/2015,10/23/2015,10/26/2015,10/27/2015,10/28/2015,10/29/2015,10/30/2015'.split(',');
dates.forEach(function(dateDay) {
    var date = new Date(dateDay);

    var formattedDate = formatDate(date);

    var sellDate = determineSellDate(date);
    var formattedSellDate = formatDate(sellDate);

    var stockPriceFiles = fs.readdirSync(pricesDir);

    var profits = [];
    stockPriceFiles.forEach(function(stockPriceFile) {
        var stock = stockPriceFile.replace(/\.json$/, '');
        var filePath = path.join(pricesDir, stockPriceFile);

        var contents = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        var startPrice = parseFloat(contents[formattedDate]);
        var sellPrice = parseFloat(contents[formattedSellDate]);

        var profit = startPrice / sellPrice;
        if (!isNaN(profit)) {
            profits.push({
                stock: stock,
                profit: profit,
                day1_close: startPrice,
                "days_later_close": sellPrice
            });
        }

    });
    profits.sort(function(a, b) {
        return b.profit - a.profit;
    });
    allData[dateDay] = profits;


    function formatDate(date) {
        var year = date.getFullYear();
        var month = ('0' + (date.getMonth() + 1)).replace(/0+/g, '0');
        month = month.substring(month.length - 2);
        var day = ('0' + date.getDate()).replace(/0+/g, '0');
        day = day.substring(day.length - 2);

        return [year, month, day].join('-');
    }




    function determineSellDate(startDate) {
        var oneDay = 1000 * 60 * 60 * 24;
        var sellDate = new Date(+date + (oneDay * 15)); //15 days later.

        while (sellDate.getDay() === 0 || sellDate.getDay() === 6) {
            sellDate = new Date(+sellDate + oneDay);
        }
        return sellDate;
    }

})

fs.writeFileSync('october-short-profits.json', JSON.stringify(allData, null, 4), 'utf-8');

