const db = require('../../db');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    winston.info('Get Dashboard Data');

    return Promise.all([
        db.Customers.count(),
        db.Posts.count({_id: {$ne: null}}),
        db.Transactions.count(),
        db.Posts.aggregate([
            { "$project": { 
                "_id": {
                    "$toString": "$_id"
                },
                "customer_id":1,
                "trip_id": 1,
                "title": 1,
                "description": 1,
                "price": 1,
                "currency": 1,
                "time_limit": 1,
                "location": 1,
                "type": 1,
                "views": 1,
                "createdAt": 1,
                "updatedAt": 1 } },
            { "$lookup": {
                "localField": "_id",
                "from": "likes",
                "foreignField": "post_id",
                "as": "likeInfo"
            } },
            { "$project": {
                "_id": 1,
                "title": 1,
                "description": 1,
                "price": 1,
                "trip_id": 1,
                "currency": 1,
                "type": 1,
                "createdAt": 1,
                "updatedAt": 1,
                "time_limit": 1,
                "customer_id": 1,
                "likes": { $size: "$likeInfo" },
            } },
            { "$sort" : {"likes": -1} },
            { "$limit" : 10 },
        ]),
        db.Customers.aggregate([
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
                "as": "postInfo"
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
                "posts": { $size: "$postInfo" },
            } },
            { "$sort" : {"posts": -1} },
            { "$limit" : 10 },
        ]),
        db.CountryPost.find({})
        .sort({"post_count": -1})
        .limit(10),
        db.Transactions.count({
            $or: [
                {status: 1},
                {status: 2},
                {status: 3},
                {status: 5}
            ]
        }),
        db.Transactions.count({
            $or: [
                {status: 6},
                {status: 7}
            ]
        }),
        db.Transactions.count({
            $or: [
                {status: 4},
                {status: 8}
            ]
        }),
    ]).then(([customers_num, posts_num, transactions_num, top_posts, top_customers, top_countries, pending_transactions, cancelled_transactions, completed_transactions]) => {
        return res.status(200).json({result: "success", customers_num, posts_num, transactions_num, top_posts, top_customers, 
                                    top_countries, pending_transactions, cancelled_transactions, completed_transactions}).end();
    }).catch((error) => console.log(error) || res.status(200).json({result:"error", errorCode: 0}).end());
};
