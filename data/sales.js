var _ = require('underscore');
var debug = require('debug');
var tingoDb = require('tingodb')().Db;
var db = new tingoDb('./db', {});
var colors = require('colors');
var async = require('async');
var Promise = require('bluebird');
var moment = require('moment');
var jsonfile = require('jsonfile');
var exports = module.exports = {};
var products = Promise.promisifyAll(require('./products.js'));
var settings = jsonfile.readFileSync('./config.json').vend;

exports.getSalesByTag = function(register_id, since, before, callback) {
    debug.log('Attempting to get product sales by Tag');
    
    products.getProductsAsync().then(function(products) {

            // Create tag map 
            var tagMap = {};
            _(products).each(function(product) {
                tagMap[product.id] = product.tags;
            });

            // Look up tag for each sale
            exports.getProductSales(register_id, since, before, function(error, sales) {
                sales = _.chain(sales)
                    .each(function(sale) {
                        sale.product_tag = tagMap[sale.product_id];
                    })
                    .groupBy(function(sale){
                        return sale.product_tag;
                    })
                    .map(function(sales, tag){
                        return {
                            tag: tag,
                            sales: _(sales).reduce(function(total, sale){
                                return total + sale.price_total;
                            }, 0)
                        };
                    })
                    .value();

                callback(null, sales);
            });
        })
        .catch(function(error) {
            debug.log('Problem retrieving products: %s', error);
            callback(error);
        });

};

exports.getProductSales = function(register_id, since, before, callback) {
    debug.log('Attempting to get all product sales');

    register_id = register_id ? register_id : settings.registers['101-Howick']; // Defaul to 101 Howick
    before = before ? before : moment().day(3).startOf('day').toDate(); // Most recent Wedesday
    since = since ? since : moment().day(-4).startOf('day').toDate(); // The Wednday prior
    debug.log('register_id: %s', register_id);
    debug.log('since: %s', since);
    debug.log('before: %s', before);

    var dbSales = db.collection('sales');
    dbSales.find({
        register_id: register_id,
        sale_date: {
            $gte: since.toISOString(),
            $lt: before.toISOString()
        }
    }, {
        register_sale_products: 1
    }).toArray(function(error, result) {
        if (error) {
            debug.log('Error trying to get product sales: %s'.red, error);
            callback(error);
        } else {
            var sales = _.chain(result)
                .pluck('register_sale_products')
                .flatten(true)
                .value();

            debug.log('Retrieved %s product sales'.green, sales.length);
            callback(null, sales);
        }
    });
};

exports.saveSale = function(sale, callback) {
    var dbSales = db.collection('sales');
    dbSales.update({
        id: sale.id
    }, sale, {
        upsert: true
    }, function(error, result) {
        if (error) {
            debug.log(('Error when upserting sale ' + sale.id + ' ' + error).red);
            callback(error);
        } else {
            callback(null, sale);
        }
    });
};

exports.saveSales = function(sales, callback) {
    debug.log('Attemping to save %s sales', sales.length);

    async.each(sales, exports.saveSale,
        function(error) {
            if (error) {
                debug.log('Error when saving sales: %s'.red, error);
                callback(error);
            } else {
                debug.log(('All %s sales saved', sales.length).green);
                callback(null, sales);
            }
        });
};

exports.getMostRecentSale = function(callback) {
    debug.log('Attemping to get the most recent sale');

    var dbSales = db.collection('sales');
    dbSales.find()
        .sort({
            'sale_date': -1
        })
        .limit(10)
        .toArray(function(error, sales) {
            if (error) {
                debug.log('Error trying to get most recent sale: %s'.red, error);
                callback(error);
            } else {
                if (sales.length == 0) callback(null, null);
                else {
                    callback(null, sales[0]);
                }
            }
        });
};
