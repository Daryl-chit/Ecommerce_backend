const db = require('../../db');
const { merge, set } = require('lodash');

module.exports = (req, res) => {
  const { id } = req.params;
  if (!db.mongoose.Types.ObjectId.isValid(id)) {
    return res.status(200).json({ result: "error", errorCode: 130 }).end();
  }

  return db.Customers.aggregate([
    {"$match": {_id: db.mongoose.Types.ObjectId(id)}},
    { "$project": { 
      "_id": { "$toString": "$_id"},
      "email":1,
      "username": 1,
      "display_name": 1,
      "bio": 1,
      "avatar": 1,
      "country": 1,
      "createdAt": 1,
      "updatedAt": 1 } },
    { "$lookup": {
        "localField": "_id",
        "from": "posts",
        "foreignField": "customer_id",
        "as": "postsInfo"
    } },
    { "$lookup": {
        "localField": "_id",
        "from": "followers",
        "foreignField": "customer_id",
        "as": "followingInfo"
    } },
    { "$lookup": {
      "localField": "_id",
      "from": "followers",
      "foreignField": "follower_id",
      "as": "followerInfo"
    } },
    { "$lookup": {
        "localField": "_id",
        "from": "feedbacks",
        "foreignField": "to_user_id",
        "as": "feedbacksInfo"
    } },
    { "$project": {
      "_id": 1,
      "email":1,
      "username": 1,
      "display_name": 1,
      "bio": 1,
      "avatar": 1,
      "country": 1,
      "createdAt": 1,
      "updatedAt": 1,
      "posts": { $size: "$postsInfo" },
      "followings": { $size: "$followingInfo" },
      "followers": { $size: "$followerInfo" },
      "rates": { $avg: "$feedbacksInfo.score" }
    } },
    { "$limit" : 1 }
  ]).then((customer) => {
      if (!customer || customer.length === 0) {
        return res.status(200).json({ result: "error", errorCode: 130 }).end();
      }

      console.log(customer)
      return res.status(200).json({ result: "success", data: customer[0] }).end();
    }).catch(error => console.log(error) || res.status(200).end());
};
