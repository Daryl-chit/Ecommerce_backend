const _ = require('lodash');

const moment = require('moment');
const {winston} = require('../../utils');
const db = require('../../db');

module.exports = (req, res) => {
  const { limit, start_at, type, customer_id, keyword } = req.query;
  let query = {};

  winston.info("Get Trip Plans");
  winston.info(req.query);

  if(keyword) {
    query.title = { "$regex": keyword, "$options": "i" }
  }

  if(type === 'new') {
    console.log(moment().toDate())
    query.to_trip_date = {
      '$gt':  moment().toDate()
    };
  }else if (type === 'past') {
    query.to_trip_date = {
      '$lt':  moment().toDate()
    };
  }

  if(customer_id) {
    query.customer_id = customer_id;
  }

  let opt = [
    { "$match": query },
    { "$project": { 
      "_id": {
        "$toString": "$_id"
      },
      "customerObjId": { "$toObjectId": "$customer_id" },
      "trip_image": 1,
      "status": 1,
      "title": 1,
      "from_trip_date": 1,
      "to_trip_date": 1,
      "views": 1,
      "is_public": 1,
      "createdAt": 1,
      "updatedAt": 1 } },
    { "$lookup": {
        "localField": "_id",
        "from": "trip_schedules",
        "foreignField": "trip_id",
        "as": "schedules"
    } },
    { "$lookup": {
      "localField": "_id",
      "from": "likes",
      "foreignField": "trip_id",
      "as": "likesInfo"
    } },
    { "$lookup": {
      "from": "likes",
      "let": { "trip_id": "$_id", "customer_id": "$customer_id" },
      "pipeline": [
          { "$match":
             { "$expr":
                { "$and":
                   [
                     { "$eq": [ "$trip_id",  "$$trip_id" ] },
                     { "$eq": [ "$customer_id", "$$customer_id" ] }
                   ]
                }
             }
          },
          { "$project": { "trip_id": 0, "_id": 0, "customer_id": 0 } }
      ],
      "as": "likeInfo"
    } },
    { "$lookup": {
      "localField": "_id",
      "from": "comments",
      "foreignField": "trip_id",
      "as": "commentsInfo"
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
      "customer_id": 1,
      "is_public": 1,
      "title": 1,
      "from_trip_date": 1,
      "to_trip_date": 1,
      "trip_image": 1,
      "views": 1,
      "createdAt": 1,
      "updatedAt": 1,
      "schedules": 1,
      "likes": { $size: "$likesInfo" },
      "comments": { $size: "$commentsInfo" },
      "is_like": { $size: "$likeInfo" },
      "customerInfo._id": 1,
      "customerInfo.email": 1,
      "customerInfo.username": 1,
      "customerInfo.display_name": 1,
      "customerInfo.avatar": 1
    } },
    { "$sort" : { "updatedAt": -1} },
    { "$limit" : (start_at?(parseInt(start_at, 10)-1):0) + parseInt(limit, 10) },
    { "$skip": (start_at?(parseInt(start_at, 10)-1):0)}
  ];

  return Promise.all([
    db.TripPlans.aggregate(opt),
    db.TripPlans.count(query)
  ]).then(([rows, total]) => {
    Promise.resolve({ rows, total, start_at, limit });
    let next_start = 0;
    if(start_at){
      next_start = (parseInt(start_at) + rows.length) >= total?null:(parseInt(start_at) + rows.length);
    }else
      next_start = rows.length;

    console.log(total)
    console.log(next_start)
    return res.status(200).json({result:"success", data: rows, total, start_at: next_start, type, customer_id, limit }).end();
  }).catch((error) => {
    console.log(error)
    return res.status(200).json({ result: "error", errorCode: 0 }).end()
  });
};
