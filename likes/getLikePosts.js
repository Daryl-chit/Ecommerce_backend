const db = require('../../db');
const { merge } = require('lodash');

module.exports = (req, res) => {
  const { limit } = req.query;

  const user = req.session.user;

  console.log(user)
  return db.Likes.aggregate([
    { "$match": {
        customer_id: user._id,
        post_id: {$ne: null}
      } },
    { "$project": { 
      "postObjId": { "$toObjectId": "$post_id" },
      "post_id": 1,
      "customer_id":1,
      "createdAt": 1,
      "updatedAt": 1 } },
    { "$lookup": {
        "localField": "postObjId",
        "from": "posts",
        "foreignField": "_id",
        "as": "post"
    } },
    { "$unwind": "$post" },
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
    console.log(posts)
    return res.status(200).json({result: "success", data: posts}).end()
  }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
