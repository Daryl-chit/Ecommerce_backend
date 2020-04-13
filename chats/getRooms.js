const db = require('../../db');
const { NUMBER_OF_ITEMS_PER_PAGE, DEFAULT_START_AT } = require('../../../common/constants');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    let { limit, start_at, chat_type } = req.query;

    winston.info('Read Chat room lists');

    limit = Number(limit) || NUMBER_OF_ITEMS_PER_PAGE;
    start_at = Number(start_at) || DEFAULT_START_AT;
    const sortBy = "updatedAt";

    const owner = req.session.user;

    let where = { };
    if(chat_type) {
        where.chat_type = (chat_type === 'request' || chat_type === 'requested')?"request":chat_type;
        if(chat_type === 'request') 
            where.owner_id = owner._id;
        else if(chat_type === 'requested') {
            where.opponent_id = owner._id;
        }
    }else {
        where = {
            $or: [
                {owner_id: owner._id}, 
                {opponent_id: owner._id}
            ]
        }
    }
    
    console.log(where)

    let opt = [
        { "$match": where },
        { "$project": {
            "_id": { "$toString": "$_id" },
            "postObjId": { "$toObjectId": "$post_id" },
            "tripObjId": { "$toObjectId": "$trip_id" },
            "opponentObjId": { "$toObjectId": "$opponent_id" },
            "ownerObjId": { "$toObjectId": "$owner_id" },
            "messageObjId": { "$toObjectId": "$last_message" },
            "post_id": 1,
            "chat_type": 1,
            "createdAt": 1,
            "updatedAt": 1 } },
        { "$lookup": {
            "localField": "_id",
            "from": "transactions",
            "foreignField": "room_id",
            "as": "transaction"
        } },
        { "$unwind": {path: "$transaction", preserveNullAndEmptyArrays: true} },
        { "$lookup": {
            "localField": "postObjId",
            "from": "posts",
            "foreignField": "_id",
            "as": "post"
        } },
        { "$unwind": {path: "$post", preserveNullAndEmptyArrays: true} },
        { "$lookup": {
            "localField": "post_id",
            "from": "post_medias",
            "foreignField": "post_id",
            "as": "mediaInfo"
        } },
        { "$lookup": {
            "localField": "tripObjId",
            "from": "trip_plans",
            "foreignField": "_id",
            "as": "trip_plan"
        } },
        { "$unwind": {path: "$trip_plan", preserveNullAndEmptyArrays: true} },
        { "$lookup": {
            "localField": "messageObjId",
            "from": "messages",
            "foreignField": "_id",
            "as": "last_message"
        } },
        { "$unwind": {path: "$last_message", preserveNullAndEmptyArrays: true} },
        { "$lookup": {
            "localField": "_id",
            "from": "messages",
            "foreignField": "room_id",
            "as": "messagesInfo"
        } },
        { "$lookup": {
            "localField": "opponentObjId",
            "from": "customers",
            "foreignField": "_id",
            "as": "opponentInfo"
        } },
        { "$unwind": {path: "$opponentInfo", preserveNullAndEmptyArrays: true} },
        { "$lookup": {
            "localField": "ownerObjId",
            "from": "customers",
            "foreignField": "_id",
            "as": "ownerInfo"
        } },
        { "$unwind": {path: "$ownerInfo", preserveNullAndEmptyArrays: true} },
        { "$addFields": { "post.mediaInfo": "$mediaInfo" } },
        { "$project": {
            "_id": 1,
            "chat_type": 1,
            "ownerInfo._id": 1,
            "ownerInfo.email": 1,
            "ownerInfo.username": 1,
            "ownerInfo.display_name": 1,
            "ownerInfo.avatar": 1,
            "opponentInfo._id": 1,
            "opponentInfo.email": 1,
            "opponentInfo.username": 1,
            "opponentInfo.display_name": 1,
            "opponentInfo.avatar": 1,
            "unread_count": { $size: {
                $filter: {
                    "input": "$messagesInfo",
                    "cond": {$eq: [ "$$this.status", 1]}
                }
            } },
            "post": 1,
            "mediaInfo": 1,
            "trip_plan": 1,
            "transaction": 1,
            "last_message": 1,
            "createdAt": 1,
            "updatedAt": 1,
        } },
        { "$sort" : {[sortBy]: -1} },
        { "$limit" : limit }
    ];

    if(start_at){
        opt.push({ "$skip" : parseInt(start_at)});
    }

    return Promise.all([
        db.ChatRooms.aggregate(opt),
        db.ChatRooms.count(where),
    ]).then(([data, total]) => {
        Promise.resolve({data, total, limit, start_at});
        start_at += limit;
        console.log(total)
        return res.status(200).json({result: "success", data, total, limit, start_at}).end();
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end())
};
