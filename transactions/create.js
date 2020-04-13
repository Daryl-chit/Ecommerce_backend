const db = require('../../db');
const { winston, notification } = require('../../utils');

module.exports = (req, res) => {
    const { room_id, traveler_id, post_id, price, payment_method_id } = req.body;
    
    winston.info('Create a new transaction');
    const user = req.session.user;

    if (!db.mongoose.Types.ObjectId.isValid(room_id)) {
        console.log('no room id');
        return res.status(200).json({ result: "error", errorCode: 2 }).end();
    }

    if (!db.mongoose.Types.ObjectId.isValid(traveler_id)) {
        console.log('no traveler id');
        return res.status(200).json({ result: "error", errorCode: 2 }).end();
    }

    if (!db.mongoose.Types.ObjectId.isValid(post_id)) {
        console.log('no post id');
        return res.status(200).json({ result: "error", errorCode: 2 }).end();
    }

    return Promise.all([
        db.Posts.findOne({
            _id: post_id
        }),
        db.Transactions.findOne({
            room_id: room_id,
            post_id: post_id
        })
    ]).then(([post, transaction]) => {
        if(!post) {
            console.log('no post');
            return res.status(200).json({result: "error", errorCode: 15}).end();
        }

        if(transaction){
            console.log('no transacion');
            return res.status(200).json({result: "error", errorCode: 15}).end();
        }

        let new_transaction = {
            room_id: room_id,
            traveler_id: traveler_id,
            buyer_id: req.session.user._id,
            post_id: post_id,
            price: price,
            currency: post.currency,
            payment_method_id: payment_method_id,
            description: "Buy " + post.title,
            status: 1
        };

        const new_message = {
            room_id: room_id,
            sender_id: req.session.user._id,
            message: "Please buy item with this deposit",
            price: price,
            action: 1,
            status: 1
        };

        return Promise.all([
            db.UserTokens.find({
                user_id: post.customer_id,
                fcm_token: {$ne: null}
            },{  "_id": 0, "fcm_token": 1}),
            db.Messages(new_message).save(),
            db.Messages.count({
                $or: [
                    {owner_id: post.customer_id},
                    {opponent_id: post.customer_id}
                ],
                status: {$ne: 2}
            })
        ]).then(([user_tokens, row2, unread_count]) => {
            return db.Transactions(new_transaction).save()
            .then((row1) => {
                let fcm_tokens = [];
                for(let i = 0; i < user_tokens.length; i += 1){
                    fcm_tokens.push(user_tokens[i].fcm_token);
                }
                const data = {
                    notification: {
                        title: "Transaction",
                        body: user.display_name + " created new transaction request",
                        badge: unread_count + 1,
                        transaction: row1,
                        chat_message: row2
                    },
                    registration_ids: fcm_tokens
                };
    
                const dataString = JSON.stringify(data);
                //send notification
                notification.sendNotification(dataString);
                return res.status(200).json({result: "success", data: {transaction: row1, messages: [row2]}}).end();
            }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
        }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
