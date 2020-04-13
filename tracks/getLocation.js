const db = require('../../db');
const { merge } = require('lodash');

module.exports = (req, res) => {
  const {customer_id} = req.query;

  if (!db.mongoose.Types.ObjectId.isValid(customer_id)) {
    return res.status(200).json({ result: "error", errorCode: 133 }).end();
  }

  return db.UserTracks.aggregate([
        { "$match": {customer_id: customer_id} },
        { "$project": { 
            "customerObjId": { "$toObjectId": "$customer_id" },
            "customer_id": 1,
            "location": 1
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
            "location": 1,
            "customerInfo._id": 1,
            "customerInfo.username": 1,
            "customerInfo.avatar": 1,
            "customerInfo.display_name": 1,
            "customerInfo.bio": 1,
            "customerInfo.country": 1
        } },
        { "$limit" : 1 },
    ]).then((track) => {
        if(!track || track.length === 0)
            return res.status(200).json({result: "error", errorCode: 271}).end();
        const location = {
            latitude: track[0].location.coordinates[1],
            longitude: track[0].location.coordinates[0]
        }
        track[0].location = location;
        console.log(track)
        return res.status(200).json({result:"success", data: track[0]}).end();
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
