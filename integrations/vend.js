var vendSdk = require('vend-nodejs-sdk')({});
var jsonfile = require('jsonfile');
var debug = require('debug');

var exports = module.exports = {};
var connectionInfo = jsonfile.readFileSync('./config.json').vend;

exports.getSalesSince = function(since, callback) {
    debug.log('Getting sales from Vend...');

    var args = vendSdk.args.sales.fetch();
    args.pageSize.value = 500;

    if (since) {
        args.since = {};
        args.since.value = since;
    }

    vendSdk.sales.fetchAll(args, connectionInfo)
        .then(function(response) {
            debug.log('Retrieved %s sales'.green, response.length);
            callback(null, response);
        })
        .catch(function(error) {
            debug.log(('Error retrieving sales from Vend: ' + error).red);
            callback(error);
        });
};

exports.getProducts = function(since, callback) {
    debug.log('Getting products from Vend...');

    var args = vendSdk.args.products.fetch();
    args.pageSize.value = 500;

    if (since) {
        args.since = {};
        args.since.value = since;
    }

    vendSdk.products.fetch(args, connectionInfo)
        .then(function(response) {
            debug.log('Retrieved %s products'.green, response.products.length);
            callback(null, response.products);
        })
        .catch(function(error) {
            debug.log(('Error retrieving products from Vend: ' + error).red);
            callback(error);
        });

};

exports.getAllProducts = function(callback) {
    debug.log('Getting all products from Vend...');

    vendSdk.products.fetchAll(connectionInfo)
        .then(function(response) {
            debug.log('Retrieved %s products'.green, response.length);
            callback(null, response);
        })
        .catch(function(error) {
            debug.log(('Error retrieving products from Vend: ' + error).red);
            callback(error);
        });

};
