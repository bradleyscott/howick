var Promise = require('bluebird');
var debug = require('debug');
var colors = require('colors');
var console = Promise.promisifyAll(require('./console.js'));

debug.log('|===================================================|'.yellow);
debug.log('| howick Vend to Xero integration is now running... |'.yellow);
debug.log('|===================================================|'.yellow);

// console.getLatestSalesAsync().then(function() {
//     return console.getAllProductsAsync();
console.getTagsAsync().then(function() {
    debug.log('|===================================================|'.yellow);
    debug.log('|   howick Vend to Xero integration has completed   |'.yellow);
    debug.log('|===================================================|'.yellow);
}).catch(function(error) {
    debug.log('Closing howick because of error: %s'.red, error);
    return;
});
