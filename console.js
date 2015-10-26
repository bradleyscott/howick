var debug = require('debug');
var colors = require('colors');
var moment = require('moment');
var Promise = require('bluebird');
var Spinner = require('cli-spinner').Spinner;
var vend = Promise.promisifyAll(require('./vend.js'));
var data = Promise.promisifyAll(require('./data.js'));
var exports = module.exports = {};

exports.getTags = function(callback) {
    var spinner = new Spinner('Getting product tags... %s');
    spinner.start();

    data.getProductTagsAsync().then(function(tags) {
            debug.log('Retrieved %s product tags', tags.length);
            spinner.stop();
            callback(tags);
        })
        .catch(function(error) {
            debug.log('Catastrophe getting product tags: %s'.red, error);
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
            return data.saveProductsAsync(products);
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

    data.getMostRecentProductAsync().then(function(product) {
            var retrieveFrom = product ? moment(product.updated_at).toDate() : moment().subtract(10, 'years');
            return vend.getProductsAsync(retrieveFrom);
        })
        .then(function(products) {
            spinner.stop();
            spinner = new Spinner('Saving products... %s');

            spinner.start();
            return data.saveProductsAsync(products);
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

    data.getMostRecentSaleAsync().then(function(sale) {
            var retrieveFrom = sale ? moment(sale.sale_date).toDate() : moment().subtract(1, 'months');
            return vend.getSalesSinceAsync(retrieveFrom);
        }).then(function(sales) {
            spinner.stop();

            spinner = new Spinner('Saving all sales... %s');
            spinner.start();
            return data.saveSalesAsync(sales);
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
