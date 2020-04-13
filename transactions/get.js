const _ = require('lodash');
const db = require('../../db');
const { winston } = require('../../utils');

module.exports = (req, res) => {
  let { limit, start_at, orderBy, asc, keyword } = req.query;

  winston.info('Get Transactions List');
  winston.info(req.query);

  const sortOrder = asc == true ? 1 : -1;

  const transactionQuery = {};
  const postQuery = {};
  const buyerQuery = {};
  const travelerQuery = {};

  if(keyword) {
      buyerQuery.$or = [
          { 'buyerInfo.email': { "$regex": keyword, "$options": "i" } },
          { 'buyerInfo.username': { "$regex": keyword, "$options": "i" } },
          { 'buyerInfo.display_name': { "$regex": keyword, "$options": "i" } },
      ];

      travelerQuery.$or = [
          { 'travelerInfo.email': { "$regex": keyword, "$options": "i" } },
          { 'travelerInfo.username': { "$regex": keyword, "$options": "i" } },
          { 'travelerInfo.display_name': { "$regex": keyword, "$options": "i" } },
      ];

      postQuery.$or = [
          { 'postInfo.title': { "$regex": keyword, "$options": "i" } }
      ];
  }
  
  return Promise.all([
      db.Transactions.aggregate([
          { "$match": transactionQuery },
          { "$project": { 
            "postObjId": { "$toObjectId": "$post_id" },
            "travelerObjId": { "$toObjectId": "$traveler_id" },
            "buyerObjId": { "$toObjectId": "$buyer_id" },
            "post_id": 1,
            "traveler_id": 1,
            "status": 1,
            "buyer_id": 1,
            "price": 1,
            "room_id": 1,
            "createdAt": 1,
            "updatedAt": 1 } },
          { "$lookup": {
            "localField": "postObjId",
            "from": "posts",
            "foreignField": "_id",
            "as": "postInfo"
          } },
          { "$unwind": "$postInfo" },
          { "$match": postQuery},
          { "$lookup": {
              "localField": "buyerObjId",
              "from": "customers",
              "foreignField": "_id",
              "as": "buyerInfo"
            } },
          { "$unwind": "$buyerInfo" },
          { "$match": buyerQuery},
          { "$lookup": {
              "localField": "travelerObjId",
              "from": "customers",
              "foreignField": "_id",
              "as": "travelerInfo"
            } },
          { "$unwind": "$travelerInfo" },
          { "$match": travelerQuery},
          { "$project": { 
            "post_id": 1,
            "traveler_id": 1,
            "buyer_id": 1,
            "status": 1,
            "price": 1,
            "room_id": 1,
            "createdAt": 1,
            "updatedAt": 1,
            "travelerInfo.id": 1,
            "travelerInfo.email": 1,
            "travelerInfo.avatar": 1,
            "travelerInfo.username": 1,
            "travelerInfo.display_name": 1,
            "travelerInfo.bio": 1,
            "travelerInfo.country": 1,
            "buyerInfo.id": 1,
            "buyerInfo.email": 1,
            "buyerInfo.avatar": 1,
            "buyerInfo.username": 1,
            "buyerInfo.display_name": 1,
            "buyerInfo.bio": 1,
            "buyerInfo.country": 1,
            "postInfo": 1
           } },
          { "$sort" : { [orderBy]: sortOrder} },
          { "$limit" : (start_at?(parseInt(start_at, 10)-1):0) + parseInt(limit, 10) },
          { "$skip": (start_at?(parseInt(start_at, 10)-1):0)}
        ]),
      db.Transactions.aggregate([
          { "$match": transactionQuery },
          { "$project": { 
            "postObjId": { "$toObjectId": "$post_id" },
            "travelerObjId": { "$toObjectId": "$traveler_id" },
            "buyerObjId": { "$toObjectId": "$buyer_id" },
            "price": 1,
            "room_id": 1,
            "createdAt": 1,
            "updatedAt": 1 } },
          { "$lookup": {
            "localField": "postObjId",
            "from": "posts",
            "foreignField": "_id",
            "as": "postInfo"
          } },
          { "$unwind": "$postInfo" },
          { "$match": postQuery},
          { "$lookup": {
              "localField": "buyerObjId",
              "from": "customers",
              "foreignField": "_id",
              "as": "buyerInfo"
            } },
          { "$unwind": "$buyerInfo" },
          { "$match": buyerQuery},
          { "$lookup": {
              "localField": "travelerObjId",
              "from": "customers",
              "foreignField": "_id",
              "as": "travelerInfo"
            } },
          { "$unwind": "$travelerInfo" },
          { "$match": travelerQuery},
          {
              "$count": "total"
          }
      ])
    ]).then(([data, total]) => {
      Promise.resolve({ data, total, start_at, limit });

      next_start = (start_at?parseInt(start_at):1) + parseInt(limit);
      if(next_start >= total){
          next_start = null;
      }
      
      return res.status(200).json({result:"success", data, total: total.length>0?total[0].total: 0, start_at: next_start?JSON.stringify(next_start):null, limit }).end();
    }).catch((error) => console.log(error) || res.status(200).json({ result: "error", errorCode: 0 }).end());
};
