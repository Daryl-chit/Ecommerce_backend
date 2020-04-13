const db = require('../../db');
const { winston } = require('../../utils');
const Request = require("request");
const { paths } = require('../../../common/constants');
const {stripe_config} = require('../../config');

module.exports = (req, res) => {
    const {code, state} = req.query;

    winston.info("Stripe redirect url");
    winston.info(req.query)

    const params = { 
        grant_type: 'authorization_code',
        client_id: stripe_config.clientId,
        client_secret: stripe_config.secretKey,
        code: code
    };

    Request.post({
        "headers": { "content-type": "application/json" },
        "url": paths.api.v1.STRIPE_TOKEN_URI,
        "body": JSON.stringify(params)
    }, (error, response, body) => {
        if(error) {
            console.log(error)
            return res.status(200).json({result: "error", errorCode: 591}).end();
        }else{
            const {stripe_user_id} = JSON.parse(response.body);
            console.log(stripe_user_id)
            console.log(state)

            return db.StCustomers.update(
                {customer_id: state},
                {$set: {account_id: stripe_user_id}}
            ).then(() => {
                return res.redirect("yaoapp://" + state);
            }).catch((error) => {
                console.log(error);
                return res.status(200).json({result:"error", errorCode: 0}).end();
            })
        }
    });
};
