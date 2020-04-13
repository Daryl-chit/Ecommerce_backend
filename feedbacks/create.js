const { merge } = require('lodash');
const db = require('../../db');
const { winston, notification } = require('../../utils');

module.exports = (req, res) => {
    let { transaction_id, feedback } = req.body;

    winston.info('Create a feedback to transaction');
    winston.info(req.body);

    const user = req.session.user;

    return db.Transactions.findOne({
        _id: transaction_id,
        $or: [
            {traveler_id: user._id}, 
            {buyer_id: user._id}
        ]        
    }).then((transaction) => {
        if (!transaction) {//invalid request
            return res.status(200).json({ result: "error", errorCode: 2 }).end();
        }

        let score = 0;
        if(feedback === 'excellent') {
            score = 5;
        }

        if(feedback === 'good') {
            score = 4;
        }

        if(feedback === 'bad') {
            score = 1;
        }

        const new_feedback = {
            transaction_id: transaction_id,
            from_user_id: user._id,
            to_user_id: user._id === transaction.traveler_id?transaction.traveler_id:transaction.buyer_id,
            owner_id: transaction.traveler_id,
            post_id: transaction.post_id,
            score: score
        };

        merge(transaction, {
            status: 8
        });

        return Promise.all([
            db.Feedbacks(new_feedback).save(),
            db.UserTokens.find({
                user_id: transaction.traveler_id,
                fcm_token: {$ne: null}
            },{  "_id": 0, "fcm_token": 1}),
            db.Messages.count({
                $or: [
                    {owner_id: transaction.traveler_id},
                    {opponent_id: transaction.traveler_id}
                ],
                status: {$ne: 2}
            }),
            transaction.save()
        ]).then(([feedback, user_tokens, unread_count]) => {
            console.log(feedback);

            let fcm_tokens = [];
            for(let i = 0; i < user_tokens.length; i += 1){
                fcm_tokens.push(user_tokens[i].fcm_token);
            }
            const data = {
                notification: {
                    title: "Transaction",
                    body: user.display_name + " provided you feedback",
                    badge: unread_count,
                    transaction: transaction
                },
                registration_ids: fcm_tokens
            };

            const dataString = JSON.stringify(data);
            //send notification
            notification.sendNotification(dataString);

            return res.status(200).json({result: "success", data: transaction}).end();
        }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
