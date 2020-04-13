const db = require('../../db');
const { merge } = require('lodash');

module.exports = (req, res) => {
  const { id } = req.params;
  console.log(id)

  if (!db.mongoose.Types.ObjectId.isValid(id)) {
    return res.status(200).json({ result: "error", errorCode: 133 }).end();
  }

    return db.Transactions.findOne({ _id: id })
    .then((transaction) => {
        if (!transaction) {
            return res.status(200).json({ result: "error", errorCode: 133 }).end();
        }

        return Promise.all([
            db.Customers.aggregate([
                {"$match": {_id: db.mongoose.Types.ObjectId(transaction.traveler_id)}},
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
                    "from": "user_tracks",
                    "foreignField": "customer_id",
                    "as": "trackInfo"
                } },
                { "$unwind": {path: "$trackInfo", preserveNullAndEmptyArrays: true} },
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
                    "trackInfo": 1
                } },
                { "$limit" : 1 }
            ]),
            db.Customers.aggregate([
                {"$match": {_id: db.mongoose.Types.ObjectId(transaction.buyer_id)}},
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
                    "from": "user_tracks",
                    "foreignField": "customer_id",
                    "as": "trackInfo"
                } },
                { "$unwind": {path: "$trackInfo", preserveNullAndEmptyArrays: true} },
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
                    "trackInfo": 1
                } },
                { "$limit" : 1 }
            ]),
            db.Posts.findOne({ _id: transaction.post_id }),
            db.PostMedias.find({ post_id: transaction.post_id})
        ]).then(([traveler, buyer, post, post_medias]) => {
            Promise.resolve({traveler, buyer, post, post_medias});

            if(post){
                merge(post._doc, {
                    'mediaInfo': post_medias
                });    
            }
            return res.status(200).json({result: "success", transaction, traveler: traveler[0], buyer: buyer[0], post}).end();
        }).catch(error => console.log(error) || res.status(200).end());
    }).catch(error => console.log(error) || res.status(200).json({}).end());
};