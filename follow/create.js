const db = require('../../db');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    let { customer_id, following } = req.body;

    winston.info('Create a new follow to customer');
    winston.info(req.body);

    if (!db.mongoose.Types.ObjectId.isValid(customer_id)) {
        return res.status(200).json({ result: "error", errorCode: 292 }).end();
    }

    return db.Followers.findOne({
        customer_id: req.session.user._id,
        follower_id: customer_id
    }).then((existFollower) => {
        if (existFollower && following) {//already following
            return res.status(200).json({ result: "error", errorCode: 290 }).end();
        }

        if(!existFollower && following){//new following
            const follow = {
                customer_id: req.session.user._id,
                follower_id: customer_id
            }
            return db.Followers(follow).save()
            .then((data) => res.status(200).json({result: "success", msg: "Follow succeed", id: data._id}).end());
        }
        
        if(!existFollower && !following) {//already unfollowing
            return res.status(200).json({ result: "error", errorCode: 291 }).end();
        }

        if(existFollower && !following) {//unfollow user
            return db.Followers.findByIdAndRemove(existFollower._id)
            .then(() => res.status(200).json({result: "success", msg: "Unfollowing succeed"}).end())
            .catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
        }
    })
    .catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
