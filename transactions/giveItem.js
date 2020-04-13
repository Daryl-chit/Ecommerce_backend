const db = require('../../db');
const {merge} = require('lodash');
const { winston, notification, stripe } = require('../../utils');

module.exports = (req, res) => {
    const { transaction_id } = req.body

    winston.info('Give item to byer');
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
        })
    ]).then(([transaction, st_customer]) => {
        if(transaction && st_customer){
            if(!st_customer.account_id) {
                return res.status(200).json({result: "error", errorCode: 157}).end();
            }
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
                },{  "_id": 0, "fcm_token": 1})
            ]).then(([unread_count, user_tokens]) => {

                //update transaction status
                merge(transaction, {
                    status: 3,
                });
                let fcm_tokens = [];
                for(let i = 0; i < user_tokens.length; i += 1){
                    fcm_tokens.push(user_tokens[i].fcm_token);
                }
                const data = {
                    notification: {
                        title: "Transaction",
                        body: user.display_name + " give item",
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
                            room_id: transaction.room_id
                        },
                        {
                            action: 3
                        }
                    ),
                    transaction.save()
                ]).then(() => {
                    return res.status(200).json({result: "success", data: transaction}).end(); 
                }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
            }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
        }else {
            return res.status(200).json({result: "error", errorCode: 133}).end();
        }
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
