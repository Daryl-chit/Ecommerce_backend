const db = require('../../db');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    const { limit, start_at, orderBy, asc, keyword } = req.query;

    winston.info('Get Customers List');
    winston.info(req.query);

    let query = {};
    if(keyword) {
        query.$or = [
            { 'email': { "$regex": keyword, "$options": "i" } },
            { 'username': { "$regex": keyword, "$options": "i" } },
            { 'display_name': { "$regex": keyword, "$options": "i" } },
        ];
    }

    const sortOrder = asc === 'true' ? 1 : -1;

    console.log(query)
    console.log((start_at?(parseInt(start_at, 10)-1):0))
    
    return Promise.all([
        db.Customers.aggregate([
            {"$match": query},
            { "$project": { 
                "_id": {
                    "$toString": "$_id"
                },
                "email": 1,
                "username":1,
                "display_name": 1,
                "avatar": 1,
                "bio": 1,
                "country": 1,
                "createdAt": 1,
                "updatedAt": 1 } },
            {"$lookup": {
                "localField": "_id",
                "from": "posts",
                "foreignField": "customer_id",
                "as": "postsInfo"
            } },
            {"$lookup": {
                "localField": "_id",
                "from": "trip_plans",
                "foreignField": "customer_id",
                "as": "tripsInfo"
            } },
            { "$project": {
                "_id": 1,
                "email": 1,
                "username": 1,
                "display_name": 1,
                "avatar": 1,
                "bio": 1,
                "country": 1,
                "createdAt": 1,
                "updatedAt": 1,
                "posts_count": { $size: "$postsInfo" },
                "trips_count": { $size: "$tripsInfo" },
            }},
            { "$sort" : {[orderBy]: sortOrder} },
            { "$limit" : (start_at?(parseInt(start_at, 10)-1):0) + parseInt(limit, 10) },
            { "$skip": (start_at?(parseInt(start_at, 10)-1):0)}
        ]),
        db.Customers.count(query)
    ]).then(([rows, total]) => {
        let next_start = 0;
        if(start_at){
            next_start = (parseInt(start_at) + rows.length) > total?null:(parseInt(start_at) + rows.length);
        }else
            next_start = rows.length;
        return res.status(200).json({result: "success", data: rows, limit: limit, start_at: next_start, total}).end();
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end())
};
