var jsonfile = require('jsonfile');
var debug = require('debug')('xero');
var Xero = require('xero');
var moment = require('moment');
var _ = require('underscore');
var exports = module.exports = {};
var config = jsonfile.readFileSync('./config.json').xero;

exports.createInvoice = function(register_id, sales, callback) {
    var rsaPrivateKey = config[register_id].rsaPrivateKey.join('\n');
    var xero = new Xero(config[register_id].consumerKey, config[register_id].consumerSecret, rsaPrivateKey);

    var invoice = {
        Type: "ACCREC",
        Contact: { Name: "Vend Reconciliation" },
        Date: moment().format('YYYY-MM-DD'),
        DueDate: moment().add(1, 'months').format('YYYY-MM-DD'),
        LineAmountTypes: 'Exclusive',
        LineItems: []
    };

    _(sales).each(function(sale){
        invoice.LineItems.push({
            Description: sale.tag == '' ? 'General' : sale.tag, // Ensure there is always a description
            Quantity: 1,
            UnitAmount: sale.revenue,
            TaxAmount: sale.tax,
            TaxType: 'OUTPUT2',
            AccountCode: 200 // Default sales account
        });
    });

    debug('Attempting to call Xero API to create Invoice');
    xero.call('POST', '/Invoices', invoice, function(error, response){
        if(error) {
            console.log('Error when trying to create Xero invoice: %s'.red, error);
            callback(error);
        }
        else {
            var invoice = response.Response.Invoices.Invoice;
            debug('Xero draft invoice %s created', invoice.InvoiceNumber);
            callback(null, invoice);
        }
    });
};
