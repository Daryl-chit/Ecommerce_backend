const _ = require('lodash');
const db = require('../../db');

module.exports = (req, res) => {
    const user = req.session.user;
    return db.ChatRooms.aggregate([
        {"$match": {
            $or: [
                {owner_id: user._id},
                {opponent_id: user._id}
            ]
        }},
        { "$project": {
            "_id": { "$toString": "$_id" },
            "opponent_id": 1,
            "owner_id": 1,
            "trip_id": 1,
            "post_id": 1,
            "chat_type": 1,
            "createdAt": 1,
            "updatedAt": 1 } },
        { "$lookup": {
            "localField": "_id",
            "from": "messages",
            "foreignField": "room_id",
            "as": "messagesInfo"
        } },
        { "$project": {
            "_id": 0,
            "room_id": "$_id",
            "unread_count": { $size: {
                $filter: {
                    "input": "$messagesInfo",
                    "cond": {$eq: [ "$$this.status", 1]}
                }
            } },
        }}
    ]).then((data) => {
        console.log(data);
        return res.status(200).json({ result: "success", data: {message_count: data} }).end();
    }).catch((error) => console.log(error) || res.status(200).json({ result: "error", errorCode: 0 }).end());
};
