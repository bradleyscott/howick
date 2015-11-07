var debug = require('debug');
var colors = require('colors');
var moment = require('moment');
var Promise = require('bluebird');
var Spinner = require('cli-spinner').Spinner;
var vend = Promise.promisifyAll(require('./integrations/vend.js'));
var sales = Promise.promisifyAll(require('./data/sales.js'));
var products = Promise.promisifyAll(require('./data/products.js'));
var exports = module.exports = {};

exports.getProductSales = function(callback) {
    var spinner = new Spinner('Getting product sales... %s');
    spinner.start();

    sales.getSalesByTagAsync(null, null, null).then(function(result) {
            spinner.stop();
            callback(null, result);
        })
        .catch(function(error) {
            debug.log('Catastrophe getting product sales: %s'.red, error);
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
            debug.log('Catastrophe getting products: %s'.red, error);
            spinner.stop();
            callback(error);
        });
};

exports.getLatestProducts = function(callback) {
    var spinner = new Spinner('Getting latest vend products... %s');
    spinner.start();

    products.getMostRecentProductAsync().then(function(product) {
            var retrieveFrom = product ? moment(product.updated_at).toDate() : moment().subtract(10, 'years');
            return vend.getProductsAsync(retrieveFrom);
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
            debug.log('Catastrophe getting products: %s'.red, error);
            spinner.stop();
            callback(error);
        });
};

exports.getLatestSales = function(callback) {
    var spinner = new Spinner('Getting latest vend sales... %s');
    spinner.start();

    sales.getMostRecentSaleAsync().then(function(sale) {
            var retrieveFrom = sale ? moment(sale.sale_date).toDate() : moment().subtract(1, 'months');
            return vend.getSalesSinceAsync(retrieveFrom);
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
            debug.log('Catastrophe getting sales: %s'.red, error);
            spinner.stop();
            callback(error);
        });
};
