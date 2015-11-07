var Promise = require('bluebird');
var debug = require('debug')('howick');
var colors = require('colors');
var commands = Promise.promisifyAll(require('./commands.js'));

console.log('|===================================================|'.yellow);
console.log('|           howick Vend to Xero integration         |'.yellow);
console.log('|===================================================|'.yellow);


var register_id, sales;
commands.getLatestSalesAsync()
    .then(function() {
        console.log('');
        console.log('Vend sales are up to date'.green);
        return commands.getLatestProductsAsync();
    })
    .then(function() {
        console.log('');
        console.log('Vend products are up to date'.green);
        return commands.getRegisterIdAsync();
    })
    .then(function(value) {
        register_id = value;
        return commands.getDateRangeAsync();
    })
    .then(function(dates) {
        return commands.getProductSalesAsync(register_id, dates[0], dates[1]);
    })
    .then(function(response) {
        sales = response;
        console.log('');
        console.log('Finished calculating product sales'.green);
        return commands.confirmSalesAsync(sales);
    })
    .then(function(confirmed) {
        if (confirmed) return commands.createInvoiceAsync(register_id, sales);
        else {
            console.log("Closing Howick as sales totals don't look right".green);
            return;
        }
    })
    .then(function(invoice) {
    	if(invoice) { // Display invoice confirm
    		console.log('');
    		console.log(('Xero draft invoice %s created for total of $' + invoice.Total).green, invoice.InvoiceNumber); 
    	}

    	// Close howick
    	console.log('');
        console.log('|===================================================|'.yellow);
        console.log('|   howick Vend to Xero integration has completed   |'.yellow);
        console.log('|===================================================|'.yellow);
    }).catch(function(error) {
        console.log('Closing howick because of error: %s'.red, error);
        return;
    });
