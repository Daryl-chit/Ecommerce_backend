const db = require('../../db');
const { winston, notification } = require('../../utils');
const { merge } = require('lodash');
const moment = require('moment');

module.exports = (req, res) => {
    const { text, action, room_id } = req.body;

    winston.info('Send message in room');
    winston.info(req.body);

    const user = req.session.user;

    return db.ChatRooms.findOne({
        $and: [
            { _id: room_id },
            { $or: 
                [
                    { owner_id: user._id },
                    { opponent_id: user._id }
                ]
            }
        ]
    }).then((row) => {
        if(!row){
            return res.status(200).json({result: "error", errorCode: 131}).end();
        }
        const message = {
            room_id: room_id,
            sender_id: user._id,
            message: text,
            action: action,//cancel, accepted
            status: 1
        };
        const receiver_id = user._id === row.owner_id?row.opponent_id:row.owner_id;
        return Promise.all([
            db.Messages(message).save(),
            db.Messages.count({
                $or: [
                    {owner_id: receiver_id},
                    {opponent_id: receiver_id}
                ],
                status: {$ne: 2}
            }),
            db.UserTokens.find({
                user_id: receiver_id,
                fcm_token: {$ne: null}
            },{  "_id": 0, "fcm_token": 1})
        ]).then(([row_msg, unread_count, user_tokens]) => {
            merge(row, {
                updatedAt: moment().unix(),
                last_message: row_msg._id
            });
            db.ChatRooms(row).save();
            io.emit('message', {message: row_msg});

            let fcm_tokens = [];
            for(let i = 0; i < user_tokens.length; i += 1){
                fcm_tokens.push(user_tokens[i].fcm_token);
            }

            const data = {
                notification: {
                    title: "New Message",
                    body: "You get message from " + user.display_name,
                    badge: unread_count + 1,
                    chat_message: row_msg
                },
                registration_ids: fcm_tokens
            };
            console.log(data)
            const dataString = JSON.stringify(data);
            notification.sendNotification(dataString);
            return res.status(200).json({result: "success", data: row_msg}).end();
        }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end())    
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end())
};
