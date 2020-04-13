const db = require('../../db');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    let { post_id } = req.body;

    winston.info('Create a new like');
    winston.info(post_id);

    return db.Posts.findOne({_id: post_id})
    .then((post) => {
        if(!post)
            return res.status(200).json({result: "error", errorCode: 31}).end();
        return db.Likes.findOne({customer_id: req.session.user._id, post_id})
        .then((existLikes) => {
            if (existLikes) {
                return res.status(200).json({ result: "error", errorCode: 221 }).end();
            }
            
            const like = {
                customer_id: req.session.user._id,
                post_id
            }
            return db.Likes(like).save()
                .then((data) => res.status(200).json({result: "success", msg: "Like succesed", _id: data._id}).end());
        }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
