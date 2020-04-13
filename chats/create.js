const db = require('../../db');
const { winston, notification } = require('../../utils');

module.exports = async(req, res) => {
    const { chat_type, opponent_id, trip_id, post_id } = req.body;

    winston.info('Create new chat room');
    winston.info(req.body);

    const owner = req.session.user;
    let val_where = {
        chat_type: chat_type,
        opponent_id: opponent_id,
        owner_id: owner._id
    };

    let trip_plan = null;
    if(trip_id) {
        val_where.trip_id = trip_id;
        trip_plan = await db.TripPlans.findOne({_id: trip_id});
    }

    let post = null;
    let mediaInfo = null;
    if(post_id) {
        val_where.post_id = post_id;
        post = await db.Posts.findOne({_id: post_id});
        mediaInfo = await db.PostMedias.findOne({post_id: post_id});
    }

    return Promise.all([
        db.ChatRooms.findOne(val_where),
        db.Customers.findOne({
            _id: opponent_id
        }),
        db.UserTokens.find({
            user_id: opponent_id,
            fcm_token: {$ne: null}
        },{  "_id": 0, "fcm_token": 1}),
        db.Messages.count({
            $or: [
                {owner_id: opponent_id},
                {opponent_id: opponent_id}
            ],
            status: {$ne: 2}
        }),
    ]).then(([room, opponent, user_tokens, unread_count]) => {
        Promise.resolve({ room, opponent, user_tokens });
        if(room){
            return db.Transactions.findOne({room_id:  room._id})
            .then((transaction) => {
                return res.status(200).json({result: "success", data: {
                    _id: room._id, 
                    owner_id: room.owner_id, 
                    opponent_id: room.opponent_id, 
                    post, 
                    mediaInfo, 
                    trip_plan, 
                    ownerInfo: req.session.user, 
                    opponentInfo: opponent, chat_type,
                    transaction: transaction
                }}).end();
            }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end())
        }
        const new_room = {
            owner_id: owner._id,
            opponent_id: opponent_id,
            trip_id: trip_id,
            post_id: post_id,
            chat_type: chat_type
        };

        return db.ChatRooms(new_room).save()
        .then((row) => {
            io.emit('message', {data: {
                _id: row._id, 
                owner_id: row.owner_id, 
                opponent_id: row.opponent_id, 
                post, 
                mediaInfo, 
                trip_plan, 
                unread_count: 0,
                ownerInfo: req.session.user, 
                opponentInfo: opponent, chat_type}
            });

            let fcm_tokens = [];
            for(let i = 0; i < user_tokens.length; i += 1){
                fcm_tokens.push(user_tokens[i].fcm_token);
            }

            const data = {
                notification: {
                    title: "New Chat room",
                    body: owner.display_name + " created new chat room",
                    badge: unread_count + 1,
                    chat_room: {
                        _id: row._id, 
                        owner_id: row.owner_id, 
                        opponent_id: row.opponent_id, 
                        post, 
                        mediaInfo, 
                        trip_plan, 
                        unread_count: 0,
                        ownerInfo: req.session.user, 
                        opponentInfo: opponent, chat_type
                    }
                },
                registration_ids: fcm_tokens
            };
            const dataString = JSON.stringify(data);
            notification.sendNotification(dataString);

            return res.status(200).json({result: "success", data: {
                _id: row._id, 
                owner_id: row.owner_id, 
                opponent_id: row.opponent_id, 
                post, 
                mediaInfo, 
                trip_plan, 
                ownerInfo: req.session.user, 
                opponentInfo: opponent, chat_type}
            }).end();
        });
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end())
};
