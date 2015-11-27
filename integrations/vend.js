var vendSdk = require('vend-nodejs-sdk')({});
var jsonfile = require('jsonfile');
var moment = require('moment');
var debug = require('debug')('vend');
var exports = module.exports = {};
var connectionInfo = jsonfile.readFileSync('./config.json').vend;

exports.getSales = function(since, callback) {
    debug('Getting sales from Vend...');

    var args = vendSdk.args.sales.fetch();
    args.pageSize.value = 500;

    if (since) {
        args.since = {};
        args.since.value = moment(since).toISOString();
    }
    debug('since: %s', args.since.value);

    vendSdk.sales.fetchAll(args, connectionInfo)
        .then(function(response) {
            debug('Retrieved %s sales', response.length);
            callback(null, response);
        })
        .catch(function(error) {
            console.log(('Error retrieving sales from Vend: ' + error).red);
            callback(error);
        });
};

exports.getProducts = function(since, callback) {
    debug('Getting products from Vend...');

    var args = vendSdk.args.products.fetch();

    if (since) {
        args.since = {};
        args.since.value = moment(since).toISOString();
    }
    debug('since: %s', args.since.value);

    vendSdk.products.fetch(args, connectionInfo)
        .then(function(response) {
            debug('Retrieved %s products', response.products.length);
            callback(null, response.products);
        })
        .catch(function(error) {
            console.log(('Error retrieving products from Vend: ' + error).red);
            callback(error);
        });

};

exports.getAllProducts = function(callback) {
    debug('Getting all products from Vend...');

    vendSdk.products.fetchAll(connectionInfo)
        .then(function(response) {
            debug('Retrieved %s products', response.length);
            callback(null, response);
        })
        .catch(function(error) {
            console.log(('Error retrieving products from Vend: ' + error).red);
            callback(error);
        });

};
