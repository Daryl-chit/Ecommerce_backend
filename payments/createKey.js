const db = require('../../db');
const { winston } = require('../../utils');
const { stripe_config } = require('../../config');
const stripe = require('stripe')(stripe_config.secretKey);

module.exports = (req, res) => {
    const stripe_version = req.body.api_version;

    winston.info("Create ephemeral key");

    if (!stripe_version) {
        return res.status(500).json({result: "error", errorCode: 1}).end();
    }
    // This function assumes that some previous middleware has determined the
    // correct customerId for the session and saved it on the request object.

    return db.StCustomers.findOne({customer_id: req.session.user._id})
    .then((st_customer) => {
        if(!st_customer) {
            return stripe.customers.create({
                description: 'Customer for ' + req.session.user.email,
                email: req.session.user.email,
                name: req.session.user.username
            }).then((customer) => {
                const st_customer = {
                    customer_id: req.session.user._id,
                    stripe_id: customer.id
                }
                return Promise.all([
                    db.StCustomers(st_customer).save(),
                    stripe.ephemeralKeys.create(
                        {customer: customer.id},
                        {stripe_version: stripe_version}
                    )     
                ]).then(([row, key]) => {
                    console.log(key)
                    return res.status(200).json(key).end()
                }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
            }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
        }

        return stripe.ephemeralKeys.create(
            {customer: st_customer.stripe_id},
            {stripe_version: stripe_version}
        ).then((key) => {
            console.log(key)
            return res.status(200).json(key).end()
        }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
    }).catch(err => console.log(err) || res.status(200).json({result: "error", errorCode: 0}).end());
};
