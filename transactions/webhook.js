const { merge, omit, isEmpty } = require('lodash');
const db = require('../../db');
const { winston } = require('../../utils');
const { stripe_config } = require('../../config');
const stripe = require('stripe')(stripe_config.secretKey);

module.exports = (req, res) => {
    const sig = request.headers['stripe-signature'];
    const body = request.body;

    console.log(sig)
    console.log(body)
  
    // let event = null;
  
    // try {
    //   event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    // } catch (err) {
    //   // invalid signature
    //   res.status(400).end();
    //   return;
    // }
  
    // let intent = null;
    // switch (event['type']) {
    //   case 'payment_intent.succeeded':
    //     intent = event.data.object;
    //     console.log("Succeeded:", intent.id);
    //     break;
    //   case 'payment_intent.payment_failed':
    //     intent = event.data.object;
    //     const message = intent.last_payment_error && intent.last_payment_error.message;
    //     console.log('Failed:', intent.id, message);
    //     break;
    // }
  
    res.sendStatus(200);
};
