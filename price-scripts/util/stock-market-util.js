var stockMarketUtil = module.exports = {};
var debug = require('yargs').argv.debug;
stockMarketUtil.isStockMarketOpen = function() {
    var date = new Date();
    var isSaturday = date.toString().indexOf('Sat') !== -1;
    var isSunday = date.toString().indexOf('Sun') !== -1;
    var isAfterOpen = date > getOpenOnDay(date);
    var isBeforeClose = date < getCloseOnDay(date);

    return (!isSaturday && !isSunday && isAfterOpen && isBeforeClose) || debug;
};

function getOpenOnDay(date) {
    var d = date.getDate();
    var m = date.getMonth() + 1;
    var y = date.getFullYear();
    var openOnDay = new Date(m + '-' + d + '-' + y + ' 9:30 EDT');
    return openOnDay;
}

function getCloseOnDay(date) {
    var d = date.getDate();
    var m = date.getMonth() + 1;
    var y = date.getFullYear();
    var closeOnDay = new Date(m + '-' + d + '-' + y + ' 16:00 EDT');
    return closeOnDay;
}
