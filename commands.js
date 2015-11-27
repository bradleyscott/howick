var debug = require('debug')('commands');
var colors = require('colors');
var moment = require('moment');
var Promise = require('bluebird');
var inquirer = require('inquirer');
var jsonfile = require('jsonfile');
var Table = require('cli-table');
var _ = require('underscore');
var registers = jsonfile.readFileSync('./config.json').vend.registers;
var Spinner = require('cli-spinner').Spinner;
var vend = Promise.promisifyAll(require('./integrations/vend.js'));
var xero = Promise.promisifyAll(require('./integrations/xero.js'));
var sales = Promise.promisifyAll(require('./data/sales.js'));
var products = Promise.promisifyAll(require('./data/products.js'));
var exports = module.exports = {};

exports.createInvoice = function(register_id, sales, callback) {
    var spinner = new Spinner('Creating draft Xero invoice... %s');
    spinner.start();

    xero.createInvoiceAsync(register_id, sales).then(function(invoice) {
            debug('Xero invoice successfully created');
            spinner.stop();
            callback(null, invoice);
        })
        .catch(function(error) {
            console.log('Problem creating Xero invoice: %s'.red, error);
            spinner.stop();
            callback(error);
        });
};

exports.confirmSales = function(sales, callback) {
    var table = new Table({
        head: ['Product tag', 'Sales (#)', 'Sales ($)', 'Tax ($)'],
        colWidths: [30, 15, 20, 20]
    });

    // Add a row for each tag
    _(sales).each(function(tag) {
        table.push([tag.tag, tag.sales, tag.revenue.toFixed(2), tag.tax.toFixed(2)]);
    });

    // Add a row for the total
    var salesTotal = _(sales).reduce(function(total, tag) {
        return total + tag.sales;
    }, 0);
    var revenueTotal = _(sales).reduce(function(total, tag) {
        var increment = tag.revenue > 0 ? tag.revenue : 0;
        return total + tag.revenue;
    }, 0);
    var taxTotal = _(sales).reduce(function(total, tag) {
        var increment = tag.tax > 0 ? tag.tax : 0;
        return total + tag.tax;
    }, 0);
    table.push(['TOTAL SALES', salesTotal, revenueTotal.toFixed(2), taxTotal.toFixed(2)]);

    console.log(table.toString());

    var question = {
        type: 'confirm',
        name: 'confirm',
        message: 'Do these sales figures look correct? Do you want to create a draft Xero invoice?',
        default: false
    };
    inquirer.prompt(question, function(answers) {
        debug('Confirmation: %s', answers.confirm);
        callback(null, answers.confirm);
    });
};

exports.getDateRange = function(callback) {

    var from = moment().day(-5).startOf('day'); // The Tuesday prior
    var fromQuestion = {
        type: 'input',
        name: 'from',
        message: 'What is date you want sales from?',
        default: from.format('DD/MM/YYYY'),
        validate: function(input) {
            var from = moment(input, "DD/MM/YYYY");
            if (from.isValid) return true;
            else return "That isn't a valid date";
        },
        filter: function(input) {
            return moment(input, "DD/MM/YYYY").toDate();
        }
    };
    inquirer.prompt(fromQuestion, function(fromAnswers) {
        from = fromAnswers.from;
        debug('from: %s', from);

        var to = moment(from).add(6, 'days'); // 6 days from the from date
        var toQuestion = {
            type: 'input',
            name: 'to',
            message: 'What is the last date you want sales for?',
            default: to.format('DD/MM/YYYY'),
            validate: function(input) {
                var from = moment(input, "DD/MM/YYYY");
                if (from.isValid) return true;
                else return "That isn't a valid date";
            },
            filter: function(input) {
                return moment(input, "DD/MM/YYYY").toDate();
            }
        };
        inquirer.prompt(toQuestion, function(toAnswers) {
            to = moment(toAnswers.to).add(1, 'day').toDate();
            debug('to: %s', to);
            callback(null, from, to);
        });
    });
};

exports.getRegisterId = function(callback) {

    var question = {
        type: 'list',
        name: 'register_id',
        message: 'Which shop do you want to retrieve sales for?',
        default: registers['101-Howick'],
        choices: [{
            name: '101 Howick',
            value: registers['101-Howick']
        }, {
            name: 'Hightide Howick',
            value: registers['HTG-Howick']
        }]
    };

    inquirer.prompt(question, function(answers) {
        debug('register_id: %s', answers.register_id);
        callback(null, answers.register_id);
    });
};

exports.getProductSales = function(register_id, from, to, callback) {
    var spinner = new Spinner('Calculating product sales... %s');
    spinner.start();

    sales.getSalesByTagAsync(register_id, from, to).then(function(result) {
            spinner.stop();
            callback(null, result);
        })
        .catch(function(error) {
            console.log('Catastrophe calculating product sales: %s'.red, error);
            spinner.stop();
            callback(error);
        });
};

exports.getAllProducts = function(callback) {
    var spinner = new Spinner('Getting all vend products... %s');
    spinner.start();

    vend.getAllProductsAsync().then(function(products) {
            spinner.stop();
            spinner = new Spinner('Saving products... %s');

            spinner.start();
            return products.saveProductsAsync(products);
        }).then(function() {
            spinner.stop();
            callback();
        })
        .catch(function(error) {
            console.log('Catastrophe getting products: %s'.red, error);
            spinner.stop();
            callback(error);
        });
};

exports.getLatestProducts = function(callback) {
    var spinner = new Spinner('Getting latest vend products... %s');
    spinner.start();

    products.getMostRecentProductAsync().then(function(product) {
            if (product) {
                var retrieveFrom = moment.utc(product.updated_at).toDate();
                return vend.getProductsAsync(retrieveFrom);
            } else return vend.getAllProductsAsync();
        })
        .then(function(result) {
            spinner.stop();
            spinner = new Spinner('Saving products... %s');

            spinner.start();
            return products.saveProductsAsync(result);
        }).then(function() {
            spinner.stop();
            callback();
        })
        .catch(function(error) {
            console.log('Catastrophe getting products: %s'.red, error);
            spinner.stop();
            callback(error);
        });
};

exports.getLatestSales = function(callback) {
    var spinner = new Spinner('Getting latest vend sales... %s');
    spinner.start();

    sales.getMostRecentSaleAsync().then(function(sale) {
            var retrieveFrom = sale ? moment.utc(sale.sale_date).toDate() : moment().subtract(6, 'weeks').toDate();
            return vend.getSalesAsync(retrieveFrom);
        }).then(function(result) {
            spinner.stop();

            spinner = new Spinner('Saving all sales... %s');
            spinner.start();
            return sales.saveSalesAsync(result);
        }).then(function() {
            spinner.stop();
            callback(null);
        })
        .catch(function(error) {
            console.log('Catastrophe getting sales: %s'.red, error);
            spinner.stop();
            callback(error);
        });
};
