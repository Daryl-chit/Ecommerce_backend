const db = require('../../db');
const { merge } = require('lodash');

module.exports = (req, res) => {
  const {id} = req.params;

  if (!db.mongoose.Types.ObjectId.isValid(id)) {
    return res.status(200).json({ result: "error", errorCode: 133 }).end();
  }

  return Promise.all([
      db.TripPlans.aggregate([
      { "$match": {_id: db.mongoose.Types.ObjectId(id)} },
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
      { "$unwind": {path: "$customerInfo", preserveNullAndEmptyArrays: true} },
      { "$project": {
        "_id": 1,
        "is_public": 1,
        "title": 1,
        "from_trip_date": 1,
        "to_trip_date": 1,
        "views": 1,
        "trip_image": 1,
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
      { "$limit" : 1 }
    ]),
    db.Comments.find({trip_id: id})
    .limit(2),
  ]).then(([trip_plan, comments]) => {
      if (!trip_plan || trip_plan.length === 0) {
        return res.status(200).json({ result: "error", errorCode: 133 }).end();
      }

      trip_plan[0].commentInfo = comments;

      db.TripPlans.updateOne({_id: id}, {views: parseInt(trip_plan[0].views) + 1});
      return res.status(200).json({result: "success", data: trip_plan[0]}).end()
    }).catch(error => console.log(error) || res.status(200).end());
};
