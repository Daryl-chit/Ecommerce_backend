const {omit} = require('lodash');
const moment = require('moment');
const db = require('../../db');

module.exports = (req, res) => {
  const { trip_id} = req.query;

  if (!db.mongoose.Types.ObjectId.isValid(trip_id)) {
    return res.status(200).json({ result: "error", errorCode: 133 }).end();
  }

  db.Posts.aggregate([
    { "$match": {trip_id: trip_id} },
    { "$project": { 
        "_id": {
            "$toString": "$_id"
        },
        "customer_id":1,
        "trip_id": 1,
        "title": 1,
        "description": 1,
        "price": 1,
        "currency": 1,
        "time_limit": 1,
        "location": 1,
        "type": 1,
        "views": 1,
        "createdAt": 1,
        "updatedAt": 1 } },
    { "$lookup": {
        "localField": "_id",
        "from": "post_medias",
        "foreignField": "post_id",
        "as": "mediaInfo"
    } },
    { "$lookup": {
        "localField": "_id",
        "from": "comments",
        "foreignField": "post_id",
        "as": "commentsInfo"
    } },
    { "$lookup": {
        "localField": "_id",
        "from": "likes",
        "foreignField": "post_id",
        "as": "likesInfo"
    } },
    { "$project": {
        "_id": 1,
        "title": 1,
        "description": 1,
        "price": 1,
        "trip_id": 1,
        "currency": 1,
        "type": 1,
        "createdAt": 1,
        "updatedAt": 1,
        "time_limit": 1,
        "customer_id": 1,
        "mediaInfo": 1,
        "comments": { $size: "$commentsInfo" },
        "likes": { $size: "$likesInfo" }
    } },
    { "$sort" : {"createdAt": -1} },
    { "$limit" : 10 },
  ]).then((posts) => {
    console.log(posts);
    return res.status(200).json({result: "success", posts}).end();
  }).catch(error => res.status(200).json({result: "error", errorCode: 0}).end());
};

function searchPost(where, limit, start_at, orderBy, offset) {
    const sort = orderBy?{[orderBy]: -1}:{ "updatedAt": -1}
    let skip = {};
    if(start_at ){
        skip = { "$skip" : parseInt(offset) + parseInt(limit, 10) * (parseInt(start_at, 10) - 1)}
    }

    return Promise.all([
        db.Posts.aggregate([
            { "$match": where },
            { "$project": { 
                "_id": {
                    "$toString": "$_id"
                },
                "customerObjId": { "$toObjectId": "$customer_id" },
                "customer_id":1,
                "trip_id": 1,
                "title": 1,
                "description": 1,
                "price": 1,
                "currency": 1,
                "time_limit": 1,
                "location": 1,
                "type": 1,
                "views": 1,
                "createdAt": 1,
                "updatedAt": 1 } },
            { "$lookup": {
                "localField": "_id",
                "from": "post_medias",
                "foreignField": "post_id",
                "as": "mediaInfo"
            } },
            { "$lookup": {
                "localField": "_id",
                "from": "comments",
                "foreignField": "post_id",
                "as": "commentsInfo"
            } },
            { "$lookup": {
                "localField": "_id",
                "from": "likes",
                "foreignField": "post_id",
                "as": "likesInfo"
            } },
            { "$lookup": {
                "localField": "owner_id",
                "from": "feedbacks",
                "foreignField": "customer_id",
                "as": "feedbacksInfo"
            } },
            { "$lookup": {
                "localField": "customerObjId",
                "from": "customers",
                "foreignField": "_id",
                "as": "customerInfo"
            } },
            { "$unwind": "$customerInfo" },
            { "$project": {
                "_id": 1,
                "title": 1,
                "description": 1,
                "price": 1,
                "trip_id": 1,
                "currency": 1,
                "type": 1,
                "createdAt": 1,
                "updatedAt": 1,
                "time_limit": 1,
                "customer_id": 1,
                "mediaInfo": 1,
                "comments": { $size: "$commentsInfo" },
                "likes": { $size: "$likesInfo" },
                "customerInfo._id": 1,
                "customerInfo.email": 1,
                "customerInfo.username": 1,
                "customerInfo.display_name": 1,
                "customerInfo.avatar": 1,
                "customerInfo.rate": { $avg: "$feedbacksInfo.score" }
            } },
            { "$sort" : sort },
            { "$limit" : parseInt(limit, 10) },
            skip
        ]),
        db.Posts.count(where)
    ]).then(([data, total]) => {
        return { data, total, start_at: skip["$skip"] + parseInt(limit), limit };
    }).catch((error) => console.log(error) || null);
}