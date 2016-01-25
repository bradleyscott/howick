var debug = require('debug')('howick');
var colors = require('colors');
var program = require('commander');
var Promise = require('bluebird');
var inquirer = require('inquirer');
var helpers = Promise.promisifyAll(require('./helpers.js'));

program
    .command('update-products')
    .description('Refresh the entire products database')
    .action(function(options) {
        var question = {
            type: 'confirm',
            name: 'confirm',
            message: 'Do you want to refresh the products database? This may take some time',
            default: false
        };
        inquirer.prompt(question, function(answers) {
            debug('Confirmation: %s', answers.confirm);
            if (answers.confirm) {
                console.log('Press Ctrl+C at any time to abort...');

                helpers.getAllProductsAsync()
                    .then(function(products) {
                        console.log('Products database is up to date'.green);
                    }).catch(function(error) {
                        console.log('Closing howick because of error: %s'.red, error);
                        return;
                    });
            } else {
                console.log('Products database refresh cancelled');
            }
        });
    });

program
    .command('update-sales')
    .description('Retrieve all sales from a specified date')
    .action(function(options) {
        console.log('Press Ctrl+C at any time to abort...');

        helpers.getAllSalesAsync()
            .then(function(products) {
                console.log('Sales are up to date'.green);
            }).catch(function(error) {
                console.log('Closing howick because of error: %s'.red, error);
                return;
            });
    });

program
    .command('reconcile')
    .description('Retrieve Vend sales and create a draft invoice in Xero')
    .usage('[options]')
    .option('-n, --noUpdate', 'Skips the sales and products update procedure. Not recommended')
    .action(function(options) {
        // Update sales and products 
        var updatePromise = Promise.pending();
        if (options.noUpdate) {
            console.log('Warning: Your sales figures might not be correct without updated data'.yellow);
            updatePromise.fulfill();
        } else {
            helpers.getLatestSalesAsync()
                .then(function() {
                    console.log('');
                    console.log('Vend sales are up to date'.green);
                    return helpers.getLatestProductsAsync();
                })
                .then(function() {
                    console.log('');
                    console.log('Vend products are up to date'.green);
                    updatePromise.fulfill();
                });
        }

        var register_id, sales, dates, totals;
        updatePromise.promise.then(function() {
                return helpers.getRegisterIdAsync();
            })
            .then(function(value) {
                register_id = value;
                return helpers.getDateRangeAsync();
            })
            .then(function(response) {
                dates = response;
                return helpers.getProductSalesAsync(register_id, dates[0], dates[1]);
            })
            .then(function(response) {
                sales = response;
                return helpers.getSalesTotalsAsync(register_id, dates[0], dates[1]);
            })
            .then(function(response){
                totals = response;
                console.log('');
                helpers.displayTotals(totals, sales); // Display totals
                return helpers.confirmViewSalesAsync(); // Ask user if they want to see sales by tag
            })
            .then(function(displaySales){
                if(displaySales) helpers.displayProductSales(sales);
                return helpers.confirmInvoiceAsync();
            })
            .then(function(invoiceConfirmed) {
                if (invoiceConfirmed) return helpers.createInvoiceAsync(register_id, sales, totals);
                else {
                    console.log("No Xero invoice created".green);
                    return;
                }
            })
            .then(function(invoice) {
                if (invoice) { // Display invoice confirm
                    console.log('');
                    console.log(('Xero draft invoice %s created for total of $' + invoice.Total).green, invoice.InvoiceNumber);
                }
            }).catch(function(error) {
                console.log('Closing howick because of error: %s'.red, error);
                return;
            });

    });

program.parse(process.argv);
if (!program.args.length) program.help();
