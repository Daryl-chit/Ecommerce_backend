const db = require('../../db');
const { winston } = require('../../utils');
const { stripe_config } = require('../../config');
const stripe = require('stripe')(stripe_config.secretKey);


module.exports = (req, res) => {
    if (!req.body.amount || !req.body.token)
    return res.status(200).json({result: "error", errorCode: 1});

    stripe.charges.create({ // charge the customer
        amount: req.body.amount,
        description: "Yao Charge",
        currency: "usd",
        source: req.body.token
    }).then(() => {
        return res.status(200).json({ result: "success", msg: "Charge Succeed" });
    }).catch(err => { console.error("stripeCharge: ", err); return res.status(200).json({result: "error", errorCode: 0}); });
};
