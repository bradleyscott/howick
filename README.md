# howick - Vend to Xero integration
## Why not use the out of the box Vend-Xero integration?
Vend supports multiple outlets. But the Vend-Xero add-on integration supports integration with only 1 Xero organisation (a many-outlet to 1-Xero org relationship). Where a vendor has setup multiple Xero organisations, each accounting for one of the Vend outlets the out-of-the-box Vend to Xero integration will not work as you can only authorise against a single Xero organisation. This means vendors need to manually enter sales data into Xero which is time consuming. 
## What does 'howick' do?
howick queries the Vend API and downloads sales across multiple outlets. Each outlet can be associated with a Xero organisation- allowing a many-outlet to many-Xero org relationship. A draft invoice is then created in Xero that totals to the amount of sales that have occured in Vend. This invoice can then be reconciled against the point-of-sales takings that are banked into the vendor's bank account. This saves a lot of manual data entry and manual reconciliation.
## How does it work?
howick is a node.js console application. It can be packaged up using Enclose.js (http://enclosejs.com/) so that the end-user does not need to worry about the Node pre-requisites or command line. 
## How do I get started?
1. Clone this repository to a local repository
1. Go to the Xero Developers Centre (http://developer.xero.com/) and then add a new Xero application at https://app.xero.com/Application/Add. Take note of the Consumer key and Consumer secret
1. Go to the Vend Developers Centre (https://developers.vendhq.com/) and then add a new Vend application at https://developers.vendhq.com/developer/applications/create. Take note of the Client Id and Client secret 
1. config.json.example should be changed to config.json and you should enter the credentials from the 2 steps above in the appropriate places and replace other placeholders with your implementation specific settings
1. Run howick in your terminal using the command: node howick.js
