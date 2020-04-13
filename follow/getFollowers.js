const _ = require('lodash');
const { NUMBER_OF_ITEMS_PER_PAGE, DEFAULT_START_AT, SORT_BY_CREATED } = require('../../../common/constants');
const db = require('../../db');

module.exports = (req, res) => {
  let { limit, start_at, sortBy, customer_id } = req.query;

  const sortOrder = 'descending';

  limit = Number(limit) || NUMBER_OF_ITEMS_PER_PAGE;
  start_at = Number(start_at) || DEFAULT_START_AT;
  sortBy = sortBy || SORT_BY_CREATED;

  const query = { 
    follower_id: customer_id 
  };

  return Promise.all([
    db.Followers.aggregate([
      { "$match": query },
      { "$project": { 
        "_id": 1,
        "customer_id": 1,
        "followerObjId": { "$toObjectId": "$follower_id" },
        "createdAt": 1,
        "updatedAt": 1 } },
      { "$lookup": {
          "localField": "followerObjId",
          "from": "customers",
          "foreignField": "_id",
          "as": "customerInfo"
      } },
      { "$unwind": "$customerInfo" },
      { "$project": {
        "_id": 0,
        "_id": "$customer_id",
        "email": "$customerInfo.email",
        "username": "$customerInfo.username",
        "display_name": "$customerInfo.display_name",
        "avatar": "$customerInfo.avatar",
        "createdAt": 1,
        "updatedAt": 1,
      } },
      { "$sort" : { "createdAt": -1 } },
      { "$skip" : (start_at && start_at != -1)?(parseInt(start_at, 10) - 1):0},
      { "$limit" : parseInt(limit, 10) }
    ]),
    db.Followers.count(query),
  ]).then(([data, total]) => {
    Promise.resolve({ data, total, start_at, limit });
    console.log(start_at)
    console.log(limit)
    console.log(data)
    console.log(total)

    if(total < start_at)
      start_at = null;
    else
      start_at = Number(start_at) + Number(limit);
    return res.status(200).json({ result: "success", data, total, start_at, limit }).end();
  }).catch((error) => console.log(error) || res.status(200).json({ result: "error", errorCode: 0 }).end());
};
