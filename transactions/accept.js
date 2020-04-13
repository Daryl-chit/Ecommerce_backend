const db = require('../../db');
const {merge} = require('lodash');
const { winston, notification, stripe } = require('../../utils');
const moment = require('moment');

module.exports = (req, res) => {
    const { transaction_id } = req.body

    winston.info('Accept a transaction');
    winston.info(req.body)

    if (!db.mongoose.Types.ObjectId.isValid(transaction_id)) {
        return res.status(200).json({ result: "error", errorCode: 2 }).end();
    }
    const user = req.session.user;

    return Promise.all([
        db.Transactions.findOne({
            _id: transaction_id
        }),
        db.StCustomers.findOne({
            customer_id: user._id
        }),
        db.Admin.find()
    ]).then(([transaction, st_customer, admin]) => {
        if(transaction && st_customer){
            if(!st_customer.account_id) {
                return res.status(200).json({result: "error", errorCode: 157}).end();
            }
            if(transaction.status === 3) {
                return res.status(200).json({result: "error", errorCode: 158}).end();
            }

            const {transaction_fee} = admin[0];

            return Promise.all([
                db.Customers.findOne({
                    _id: transaction.buyer_id
                }),
                db.StCustomers.findOne({
                    customer_id: transaction.buyer_id
                })
            ]).then(([buyer, st_buyer]) => {
                if(!buyer || !st_buyer)
                    return res.status(200).json({result: "error", errorCode: 1}).end();
                const fee_rate = transaction_fee;

                return stripe.clonePaymentMethodToConnectedAccount(st_buyer.stripe_id, transaction.payment_method_id, st_customer.account_id)
                .then((payment_method) => {
                    return Promise.all([
                        db.Messages.count({
                            $or: [
                                {owner_id: transaction.buyer_id},
                                {opponent_id: transaction.buyer_id}
                            ],
                            status: {$ne: 2}
                        }),
                        db.UserTokens.find({
                            user_id: transaction.buyer_id,
                            fcm_token: {$ne: null}
                        },{  "_id": 0, "fcm_token": 1}),
                        stripe.createDirectPayment(st_buyer.stripe_id, payment_method.id, st_customer.account_id, 
                            transaction.price, transaction.currency, transaction.description, fee_rate)
                    ]).then(([unread_count, user_tokens, paymentIntent]) => {
                        let fcm_tokens = [];
                        for(let i = 0; i < user_tokens.length; i += 1){
                            fcm_tokens.push(user_tokens[i].fcm_token);
                        }
                        
                        //update transaction status
                        merge(transaction, {
                            status: 5,
                            payment_method_id: payment_method.id,
                            payment_intent_id: paymentIntent.id,
                            updatedAt: moment()
                        });
                        const data = {
                            notification: {
                                title: "Transaction",
                                body: user.display_name + " accepted your transaction request",
                                badge: unread_count,
                                transaction: transaction
                            },
                            registration_ids: fcm_tokens
                        };
        
                        const dataString = JSON.stringify(data);
                        //send notification
                        notification.sendNotification(dataString);
    
                        //update message status
                        return Promise.all([
                            db.Messages.update(
                                {
                                    room_id: transaction.room_id,
                                    action: 1
                                },
                                {
                                    action: 5
                                }
                            ),
                            transaction.save()
                        ]).then(() => {
                            console.log(transaction)
                            return res.status(200).json({result: "success", data: transaction}).end(); 
                        }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
                    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
                }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
            }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
        }else {
            return res.status(200).json({result: "error", errorCode: 133}).end();
        }
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
