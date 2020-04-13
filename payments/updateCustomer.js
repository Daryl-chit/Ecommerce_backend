const { stripe_config } = require('../../config');
const stripe = require('stripe')(stripe_config.secretKey);

module.exports = (req, res) => {
    if (!req.body.token)
    return res.status(200).json({result: "error", errorCode: 1});

    return stripe.customers.update(req.body.token)
    .then(() => {
        // asynchronously called
        return res.status(200).json({result: "success", msg:"Customer was updated on stripe"}).end();
    }).catch(err => { console.error("strip Create: ", err); return res.status(200).json({result: "error", errorCode: 0}); });
};
