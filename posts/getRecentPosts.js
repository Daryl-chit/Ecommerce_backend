const db = require('../../db');
const { merge } = require('lodash');

module.exports = (req, res) => {
  const { customer_id, limit } = req.query;
  if (!db.mongoose.Types.ObjectId.isValid(customer_id)) {
    return res.status(200).json({ result: "error", errorCode: 130 }).end();
  }

  return db.Posts.aggregate([
    { "$match": {customer_id: customer_id} },
    { "$project": { 
      "post_id": { "$toString": "$_id" },
      "customer_id":1,
      "trip_id": 1,
      "title": 1,
      "description": 1,
      "price": 1,
      "currency": 1,
      "time_limit": 1,
      "item_address": 1,
      "view_counts": 1,
      "createdAt": 1,
      "updatedAt": 1 } },
    { "$lookup": {
        "localField": "post_id",
        "from": "post_medias",
        "foreignField": "post_id",
        "as": "mediaInfo"
    } },
    { "$project": {
        __v:0
    } },
    { "$sort" : {"createdAt": -1} },
    { "$limit" : Number(limit) },
  ]).then((posts) => {
    return res.status(200).json({result: "success", data: posts}).end()
  }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
