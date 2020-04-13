const db = require('../../db');
const { omit, merge } = require('lodash');
const { winston } = require('../../utils');

module.exports = (req, res) => {
  let query = req.body;
  const { id } = req.params;
  const file = req.file;

  winston.info(`Update a user by Id : ${id}`);
  winston.info(query);

  if (!db.mongoose.Types.ObjectId.isValid(id)) {
    return res.status(200).json({ result: "error", errorCode: 2 }).end();
  }

  return db.Customers.findOne({ _id: id })
    .then((currentUser) => {
      if (!currentUser) {
        return res.status(200).json({ result: "error", errorCode: 110 }).end();
      }

      if(file){
        merge(query, {
          avatar: "\\"  + file.path
        });  
      }

      merge(currentUser, query);
      console.log(currentUser)

      return currentUser.save()
      .then(() => {
        return db.Customers.aggregate([
          {"$match": {_id: db.mongoose.Types.ObjectId(id)}},
          { "$project": { 
            "_id": {
                "$toString": "$_id"
            },
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
              "localField": "to_user_id",
              "from": "feedbacks",
              "foreignField": "customer_id",
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
            "rate": { $avg: "$feedbacksInfo.score" }
          } },
          { "$limit" : 1 }
        ]).then((customer) => {
          return res.status(200).json({ result: "success", data: customer[0] }).end();
        });
      });
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
