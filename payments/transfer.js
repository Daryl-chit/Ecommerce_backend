const db = require('../../db');
const { winston } = require('../../utils');
const { stripe_config } = require('../../config');
const stripe = require('stripe')(stripe_config.secretKey);

module.exports = (req, res) => {
    stripe.transfers.create({
        amount: req.body.amount,
        currency: "usd",
        destination: req.body.destination
    }, function(err, transfer) {
        console.log(err, transfer);
        if (err)
            return res.status(200).json({result: "error"});

        return res.status(200).json({ result: "success" });
    }).catch(err => { console.error("stripeTransfer Error: ", err); return res.status(200).json({result: "error", msg: "internal"}); });
};
