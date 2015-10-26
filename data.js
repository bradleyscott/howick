var debug = require('debug');
var tingoDb = require('tingodb')().Db;
var db = new tingoDb('data', {});
var colors = require('colors');
var async = require('async');
var Promise = require('bluebird');
var exports = module.exports = {};

exports.getProductTags = function(callback) {
    debug.log('Attempting to get a list of all product tags');

    var dbProducts = db.collection('products');
    dbProducts.find({}, { tags: 1 }).toArray(function(error, tags) {
        if (error) {
            debug.log('Error trying to get product tags: %s'.red, error);
            callback(error);
        }
        else {
        	callback(null, tags);
        }
    });
};

exports.getMostRecentProduct = function(callback) {
    debug.log('Attempting to get the most recently updated product');

    var dbProducts = db.collection('products');
    dbProducts.find()
        .sort({
            'updated_at': -1
        })
        .limit(10)
        .toArray(function(error, products) {
            if (error) {
                debug.log('Error trying to get most recent products: %s'.red, error);
                callback(error);
            } else {
                if (products.length == 0) callback(null, null);
                else {
                    callback(null, products[0]);
                }
            }
        });
};

exports.saveProduct = function(product, callback) {
    var dbProducts = db.collection('products');
    dbProducts.update({
        id: product.id
    }, product, {
        upsert: true
    }, function(error, result) {
        if (error) {
            debug.log(('Error when upserting product %s' + error).red, product.id);
            callback(error);
        } else {
            callback(null);
        }
    });
};

exports.saveProducts = function(products, callback) {
    debug.log('Attemping to save %s products', products.length);

    async.each(products, exports.saveProduct,
        function(error) {
            if (error) {
                debug.log('Error when saving products: %s'.red, error);
                callback(error);
            } else {
                debug.log('All %s products saved'.green, products.length);
                callback();
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
            callback(null);
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
                callback();
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
