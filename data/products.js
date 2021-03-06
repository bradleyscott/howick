var debug = require('debug')('products');
var tingoDb = require('tingodb')().Db;
var db = new tingoDb('./db', {});
var colors = require('colors');
var async = require('async');
var Promise = require('bluebird');
var exports = module.exports = {};

exports.getProducts = function(callback) {
    debug('Attempting to get all products from db');

    var dbProducts = db.collection('products');
    dbProducts.find().toArray(function(error, products){
        if(error) {
            console.log('Error trying to get products: %s'.red, error);
            callback(error);
        }
        else {
            debug('Retrieved %s products', products.length);
            callback(null, products);
        }
    });
};

exports.getMostRecentProduct = function(callback) {
    debug('Attempting to get the most recently updated product from db');

    var dbProducts = db.collection('products');
    dbProducts.find()
        .sort({
            'updated_at': -1
        })
        .limit(10)
        .toArray(function(error, products) {
            if (error) {
                console.log('Error trying to get most recent products: %s'.red, error);
                callback(error);
            } else {
                if (products.length == 0) callback(null, null);
                else {
                    var product = products[0];
                    debug('Most recent product updated: ', product.updated_at);
                    callback(null, product);
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
            console.log(('Error when upserting product %s' + error).red, product.id);
            callback(error);
        } else {
            debug('Saved product %s', product.id);
            callback(null);
        }
    });
};

exports.saveProducts = function(products, callback) {
    debug('Attemping to save %s products', products.length);

    async.each(products, exports.saveProduct,
        function(error) {
            if (error) {
                console.log('Error when saving products: %s'.red, error);
                callback(error);
            } else {
                debug('All %s products saved'.green, products.length);
                callback();
            }
        });
};
