const db = require('../../db');
const { merge } = require('lodash');

module.exports = (req, res) => {
  const { id } = req.params;
  console.log(id)

  if (!db.mongoose.Types.ObjectId.isValid(id)) {
    return res.status(200).json({ result: "error", errorCode: 133 }).end();
  }

  return db.Posts.aggregate([
      { "$match": {_id: db.mongoose.Types.ObjectId(id)} },
      { "$project": { 
        "_id": { "$toString": "$_id" },
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
        "localField": "owner_id",
        "from": "feedbacks",
        "foreignField": "customer_id",
        "as": "feedbacksInfo"
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
        "location": 1,
        "final_location": 1,
        "type": 1,
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
        "customerInfo.rate": { $avg: "$feedbacksInfo.score" }
      } },
      { "$sort" : {"createdAt": -1} },
      { "$limit" : 1 },
    ]).then((post) => {
      if (!post || post.length === 0) {
        return res.status(200).json({ result: "error", errorCode: 133 }).end();
      }
      console.log(post);

      const customer_id = post[0].customer_id;
      const title = post[0].title;
      
      const split_title = title.split(' ');
      let related_keywords = [];
      for(let id = 0; id < split_title.length; id += 1){
        related_keywords.push(
            {'title': split_title[id]}
        );
      }
      //get user's other posts and related posts
      return Promise.all([
        db.Comments.find({post_id: id})
        .limit(2),
        db.Posts.aggregate([
          { "$match": {customer_id: customer_id} },
          { "$project": { 
            "_id": { "$toString": "$_id" },
            "customer_id":1,
            "trip_id": 1,
            "title": 1,
            "description": 1,
            "price": 1,
            "currency": 1,
            "type": 1,
            "time_limit": 1,
            "location": 1,
            "final_location": 1,
            "views": 1,
            "createdAt": 1,
            "updatedAt": 1 } },
          { "$lookup": {
              "localField": "_id",
              "from": "post_medias",
              "foreignField": "post_id",
              "as": "mediaInfo"
          } },
          { "$project": {
              __v:0
          } },
          { "$sort" : {"createdAt": -1} },
          { "$limit" : 4 },
        ]),
        db.Posts.aggregate([
          { "$match": {
              $or: related_keywords
          } },
          { "$project": { 
            "_id": { "$toString": "$_id" },
            "customer_id":1,
            "trip_id": 1,
            "title": 1,
            "description": 1,
            "price": 1,
            "currency": 1,
            "type": 1,
            "time_limit": 1,
            "location": 1,
            "final_location": 1,
            "views": 1,
            "createdAt": 1,
            "updatedAt": 1 } },
          { "$lookup": {
              "localField": "_id",
              "from": "post_medias",
              "foreignField": "post_id",
              "as": "mediaInfo"
          } },
          { "$project": {
              __v:0
          } },
          { "$sort" : {"createdAt": -1} },
          { "$limit" : 4 },
        ])
      ]).then(([comments, other_posts, related_posts]) => {
        post[0].commentInfo = comments;
        db.Posts.updateOne({_id: id}, {views: parseInt(post[0].views) + 1});
        
        return res.status(200).json({result: "success", data: {post: post[0], other_posts, related_posts}}).end()
      }).catch(error => console.log(error) || res.status(200).end());
      
    }).catch(error => console.log(error) || res.status(200).end());
};
