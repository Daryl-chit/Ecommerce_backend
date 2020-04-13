const db = require('../../db');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    const { limit, start_at, keyword, latitude, longitude, radius } = req.query;

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

    return Promise.all([
        db.UserTracks.aggregate([
            { "$geoNear": {
                "near": { 
                    "type": "Point", 
                    "coordinates": [ parseFloat(longitude), parseFloat(latitude) ]
                },
                "distanceField": "distance",
                "maxDistance": parseInt(radius),
                "spherical": true
            }},
            { "$project": { 
                "_id": 1,
                "customerObjId": { "$toObjectId": "$customer_id" },
                "customer_id":1,
                "location": 1,
                "createdAt": 1,
                "updatedAt": 1 } },
            { "$lookup": {
                "localField": "customerObjId",
                "from": "customers",
                "foreignField": "_id",
                "as": "customerInfo"
            } },
            { "$unwind": "$customerInfo" },
            { "$match": query},
            { "$project": { 
                "_id": 1,
                "customer_id":1,
                "location": 1,
                "createdAt": 1,
                "updatedAt": 1,
                "customerInfo._id": 1,
                "customerInfo.email": 1,
                "customerInfo.display_name": 1,
                "customerInfo.username": 1,
                "customerInfo.avatar": 1,
                "customerInfo.bio": 1,
                "customerInfo.country": 1,
                "customerInfo.createdAt": 1,
                "customerInfo.updatedAt": 1,
                "distance": 1
            } },
            { "$sort" : {'distance': -1} },
            { "$limit" : 10 },
            { "$skip" : 0}
        ]),
        db.UserTracks.aggregate([
            { "$geoNear": {
                "near": { 
                    "type": "Point", 
                    "coordinates": [ parseFloat(longitude), parseFloat(latitude) ]
                },
                "distanceField": "distance",
                "maxDistance": radius,
                "spherical": true
            }},
            { "$project": { 
                "_id": 1,
                "customerObjId": { "$toObjectId": "$customer_id" },
                "customer_id":1,
                "location": 1,
                "createdAt": 1,
                "updatedAt": 1 } },
            { "$lookup": {
                "localField": "customerObjId",
                "from": "customers",
                "foreignField": "_id",
                "as": "customerInfo"
            } },
            { "$match": query},
            { "$count" : "total" },
        ])
    ])
    .then(([rows, total]) => {
        for(let i = 0; i < rows.length; i += 1) {
            const location = {
                latitude: rows[i].location.coordinates[1],
                longitude: rows[i].location.coordinates[0]
            }
            rows[i].location = location;
        }
        let offset = 0;
        if(start_at)
            offset = parseInt(start_at) + rows.length;
        else
            offset = rows.length;
        return res.status(200).json({result: "success", data: rows, limit: limit, start_at: offset, total: total.length>0?total[0].total:0}).end();
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end())
};
