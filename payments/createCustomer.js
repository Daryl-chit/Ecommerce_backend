const db = require('../../db');
const { winston } = require('../../utils');
const { stripe_config } = require('../../config');
const stripe = require('stripe')(stripe_config.secretKey);
const { merge } = require('lodash');

module.exports = (req, res) => {
    if (!req.body.token)
    return res.status(200).json({result: "error", errorCode: 1});

    stripe.customers.create({
        description: 'Customer for Yao',
        source: req.body.token // obtained with Stripe.js
    }).then((customer) => {
    // asynchronously called
        const customer_id = customer.id;
        return db.Customers.findOne({_id: req.session.user._id})
        .then((customer) => {
            merge(customer, {
                stripe_id: customer_id
            });

            return customer.save()
                .then(() => res.status(200).json({result: "success", msg:"Customer was created on stripe"}).end());
        }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}));
    }).catch(err => { console.error("strip Create: ", err); return res.status(200).json({result: "error", errorCode: 0}); });
};
