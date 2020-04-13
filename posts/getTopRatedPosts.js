const db = require('../../db');
const { merge } = require('lodash');

module.exports = (req, res) => {
  const { customer_id, limit } = req.query;

  if (!db.mongoose.Types.ObjectId.isValid(customer_id)) {
    return res.status(200).json({ result: "error", errorCode: 130 }).end();
  }

  return db.Feedbacks.aggregate([
    { "$match": {owner_id: customer_id} },
    { "$project": { 
      "postObjId": { "$toObjectId": "$post_id" },
      "score":1,
      "from_user_id": 1,
      "post_id": 1,
      "owner_id": 1,
      "type": 1,
      "createdAt": 1,
      "updatedAt": 1 } },
    { "$lookup": {
        "localField": "postObjId",
        "from": "posts",
        "foreignField": "_id",
        "as": "postInfo"
    } },
    { "$lookup": {
        "localField": "post_id",
        "from": "post_medias",
        "foreignField": "post_id",
        "as": "mediaInfo"
    } },
    { "$project": {
        __v:0
    } },
    { "$sort" : {"score": -1} },
    { "$limit" : Number(limit) },
  ]).then((posts) => {
    return res.status(200).json({result: "success", data: posts}).end()
  }).catch(error => {
    console.log(error)
    return res.status(200).json({result: "error", errorCode: 0}).end()
  });
};
