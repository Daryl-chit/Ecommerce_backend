const moment = require('moment');
const db = require('../../db');

module.exports = (req, res) => {
    const { limit, start_at, following, orderBy } = req.body;

    console.log(req.body)
    let val_where = getWhereQuery(req.body);
    const user = req.session.user;
    if(following){
        return followingPosts(user, limit, start_at, orderBy, val_where)
        .then((posts) => {
            if(!posts) {
                return res.status(200).json({result: "success", data: null}).end();
            }
            const {data, total, start_at, limit} = posts;
            return res.status(200).json({result: "success", data, total, start_at, limit}).end()
        })
    }else{
        // return db.Followers.find({customer_id: user._id})
        // .distinct('follower_id')
        // .then((rows) => {
        //     return db.Customers.find({
        //         $or: [
        //             {is_public: true},
        //             {
        //                 is_public: false,
        //                 _id: {
        //                     $in: rows
        //                 }
        //             }
        //         ]
        //     }).distinct('_id')
        //     .then((customers) => {
        //         for(let i = 0; i < customers.length; i += 1)
        //             customers[i] = customers[i].toString();
        //         val_where.customer_id = {
        //             $in: customers
        //         };
                return searchPost(val_where, limit, start_at, orderBy)
                .then((posts) => {
                    if(!posts) {
                        return res.status(200).json({result: "success", data: null}).end();
                    }
                    const {data, total, start_at, limit} = posts;
                    return res.status(200).json({result: "success", data, total, start_at, limit}).end()
                }).catch(() => res.status(200).json({ result: "error", errorCode: 0 }).end());
        //     }).catch((error) => console.log(error) || res.status(200).json({ result: "error", errorCode: 0 }).end());
        // }).catch((error) => console.log(error) || res.status(200).json({ result: "error", errorCode: 0 }).end());
    }    
};

function followingPosts(user, limit, start_at, orderBy, where) {// get posts that user is following.
    
    return db.Followers.find({customer_id: user._id})
    .select('follower_id')
    .then((rows) => {
        let val_where = where?where:{};
        val_where.customer_id = {
            $in: rows
        };
        
        return searchPost(val_where, limit, start_at, orderBy)
        .then((posts) => posts)
        .catch(() => res.status(200).json({ result: "error", errorCode: 0 }).end());    
    }).catch(() => res.status(200).json({ result: "error", errorCode: 0 }).end());
}

function getWhereQuery(body) {
    const { customer_id, keyword, within, price_range} = body;
    let val_where = {};

    if(customer_id) {
        val_where.customer_id = customer_id;
        return val_where;
    }

    if(price_range) {
        if(price_range.from){
            val_where['price'] = {
                $gte: price_range.from
            }
        }
        if(price_range.to) {
            val_where['price'] = {
                $lte: price_range.to
            }
        }
    }
    if(within){
        let time_limit = null;
        if(within === '24hrs'){
            time_limit = moment().subtract(24, 'hours').toDate();
        }
        if(within === '7days'){
            time_limit = moment().subtract(7, 'days').toDate();
        }
        if(within === '30days'){
            time_limit = moment().subtract(30, 'days').toDate();
        }
        val_where.time_limit = {
            $gte: time_limit
        }
    }
    if(keyword) {
        val_where['$or'] = [
            {'title': { "$regex": keyword, "$options": "i" }},
            {'description': { "$regex": keyword, "$options": "i" }},
            {'item_address.place_name': { "$regex": keyword, "$options": "i" }},
        ]
    }

    return val_where;
}

function searchPost(where, limit, start_at, orderBy) {
    const sort = orderBy?{[orderBy]: -1}:{ "updatedAt": -1}
    let skip = { "$skip" : (start_at && start_at != -1)?(parseInt(start_at, 10) - 1):0}
    return Promise.all([
        db.Posts.aggregate([
            { "$match": where },
            { "$project": { 
                "_id": {
                    "$toString": "$_id"
                },
                "customerObjId": { "$toObjectId": "$customer_id" },
                "customer_id":1,
                "trip_id": 1,
                "title": 1,
                "description": 1,
                "price": 1,
                "currency": 1,
                "time_limit": 1,
                "location": 1,
                "final_location": 1,
                "type": 1,
                "views": 1,
                "createdAt": 1,
                "updatedAt": 1 } },
            { "$lookup": {
                "localField": "_id",
                "from": "post_medias",
                "foreignField": "post_id",
                "as": "mediaInfo"
            } },
            { "$lookup": {
                "localField": "_id",
                "from": "comments",
                "foreignField": "post_id",
                "as": "commentsInfo"
            } },
            { "$lookup": {
                "localField": "_id",
                "from": "likes",
                "foreignField": "post_id",
                "as": "likesInfo"
            } },
            { "$lookup": {
                "from": "likes",
                "let": { "post_id": "$_id", "customer_id": "$customer_id" },
                "pipeline": [
                    { "$match":
                       { "$expr":
                          { "$and":
                             [
                               { "$eq": [ "$post_id",  "$$post_id" ] },
                               { "$eq": [ "$customer_id", "$$customer_id" ] }
                             ]
                          }
                       }
                    },
                    { "$project": { "post_id": 0, "_id": 0, "customer_id": 0 } }
                ],
                "as": "likeInfo"
            } },
            { "$lookup": {
                "localField": "customer_id",
                "from": "feedbacks",
                "foreignField": "to_user_id",
                "as": "feedbacksInfo"
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
                "title": 1,
                "description": 1,
                "price": 1,
                "trip_id": 1,
                "currency": 1,
                "type": 1,
                "location": 1,
                "final_location": 1,
                "createdAt": 1,
                "updatedAt": 1,
                "time_limit": 1,
                "customer_id": 1,
                "mediaInfo": 1,
                "comments": { $size: "$commentsInfo" },
                "likes": { $size: "$likesInfo" },
                "is_like": { $size: "$likeInfo" },
                "customerInfo._id": 1,
                "customerInfo.email": 1,
                "customerInfo.username": 1,
                "customerInfo.display_name": 1,
                "customerInfo.avatar": 1,
                "customerInfo.rates": { $avg: "$feedbacksInfo.score" }
            } },
            { "$sort" : sort },
            { "$limit" : (start_at?(parseInt(start_at, 10) - 1):0) + parseInt(limit, 10) },
            skip
        ]),
        db.Posts.count(where)
    ]).then(([data, total]) => {
        next_start = (start_at?parseInt(start_at):1) + parseInt(limit);
        if(next_start >= total){
            next_start = null;
        }
        console.log(data)

        return { data, total, start_at: next_start?JSON.stringify(next_start):null, limit };
    }).catch((error) => console.log(error) || null);
}