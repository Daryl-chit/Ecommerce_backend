const db = require('../../db');
const { NUMBER_OF_ITEMS_PER_PAGE, DEFAULT_START_AT } = require('../../../common/constants');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    let { post_id, trip_id, limit, start_at } = req.query;

    winston.info('Get Comments');
    winston.info(req.query);

    limit = Number(limit) || NUMBER_OF_ITEMS_PER_PAGE;
    start_at = Number(start_at) || DEFAULT_START_AT;

    let where = {};
    if(post_id) {
        where.post_id = post_id;
    }
    if(trip_id) {
        where.trip_id = trip_id;
    }

    return Promise.all([
        db.Comments.aggregate([
            { "$match": where },
            { "$project": { 
                "_id": {
                    "$toString": "$_id"
                },
                "customerObjId": { "$toObjectId": "$customer_id" },
                "post_id": 1,
                "trip_id": 1,
                "comment": 1,
                "createdAt": 1,
                "updatedAt": 1 } },
            { "$lookup": {
                "localField": "customerObjId",
                "from": "customers",
                "foreignField": "_id",
                "as": "customerInfo"
            } },
            { "$unwind": "$customerInfo" },
            { "$project": {
                "_id": 1,
                "post_id": 1,
                "trip_id": 1,
                "comment": 1,
                "trip_id": 1,
                "createdAt": 1,
                "updatedAt": 1,
                "customerInfo._id": 1,
                "customerInfo.email": 1,
                "customerInfo.username": 1,
                "customerInfo.display_name": 1,
                "customerInfo.avatar": 1,
                "customerInfo.bio": 1,
                "customerInfo.country": 1,
            } },
            { "$sort" : {"createdAt": -1} },
            { "$limit" : parseInt(limit, 10) },
            { "$skip" : parseInt(start_at)}
        ]),
        db.Comments.aggregate([
            { "$match": where },
            { "$project": { 
                "_id": {
                    "$toString": "$_id"
                },
                "customerObjId": { "$toObjectId": "$customer_id" },
                "post_id": 1,
                "trip_id": 1,
                "comment": 1,
                "createdAt": 1,
                "updatedAt": 1 } },
            { "$lookup": {
                "localField": "customerObjId",
                "from": "customers",
                "foreignField": "_id",
                "as": "customerInfo"
            } },
            { "$unwind": "$customerInfo" },
            { "$project": {
                "_id": 1,
            } },
            { "$count" : 'total'}
        ])
    ]).then(([row, total]) => {
        console.log(row)
        console.log(total)
        if(!row){
            return res.status(200).json({result: "error", errorCode: 181}).end();
        }

        if(total < start_at)
            start_at = null;
        else
            start_at = parseInt(start_at) + parseInt(limit);
        return res.status(200).json({result: "success", data: row, start_at, total, limit})
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end())
};
