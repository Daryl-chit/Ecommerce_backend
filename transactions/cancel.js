const { merge } = require('lodash');
const db = require('../../db');
const { winston, notification, stripe } = require('../../utils');
const moment = require('moment');

module.exports = (req, res) => {
    const { transaction_id, cancelled_by_traveler} = req.body

    winston.info('Cancel a transaction');

    if (!db.mongoose.Types.ObjectId.isValid(transaction_id)) {
        return res.status(200).json({ result: "error", errorCode: 0 }).end();
    }

    const user = req.session.user;

    return Promise.all([
        db.Transactions.findOne({
            _id: transaction_id
        }),
        db.StCustomers.findOne({
            customer_id: user._id
        })
    ]).then(([transaction, st_customer]) => {
        if(transaction){
            return Promise.all([
                db.Messages.count({
                    $or: [
                        {owner_id: transaction.traveler_id},
                        {opponent_id: transaction.traveler_id}
                    ],
                    status: {$ne: 2}
                }),
                db.UserTokens.find({
                    user_id: transaction.traveler_id,
                    fcm_token: {$ne: null}
                },{  "_id": 0, "fcm_token": 1}),
            ]).then(([unread_count, user_tokens]) => {
                //update transaction status
                merge(transaction, {
                    by_buyer: cancelled_by_traveler,
                    status: 7,
                    updatedAt: moment()
                });

                let fcm_tokens = [];
                for(let i = 0; i < user_tokens.length; i += 1){
                    fcm_tokens.push(user_tokens[i].fcm_token);
                }
                const data = {
                    notification: {
                        title: "Transaction",
                        body: user.display_name + " cancelled his transaction request",
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
                            action: {$ne: null}
                        },
                        {
                            action: 7,
                            by_buyer: cancelled_by_traveler
                        }
                    ),
                    transaction.save(),
                    stripe.cancelPayment(st_customer.account_id, transaction.payment_intent_id)
                ]).then(() => {
                    return res.status(200).json({result: "success", data: transaction}).end(); 
                }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
            }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
        }else{
            return res.status(200).json({result: "error", erroCode: 15}).end();
        }
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());

};
