const db = require('../../db');
const { winston } = require('../../utils');
const moment = require('moment');

module.exports = (req, res) => {
    const {post_range, post_date} = req.query;

    winston.info('Get Posts Data');
    winston.info(req.query);

    let post_query = {};
    post_query.createdAt = {
        $gte: moment(post_date).subtract(1, 'month'),
        $lte: moment(post_date).add(1, 'month'),
    }
    if(post_range == 1){
        post_query.createdAt = {
            $gte: moment(post_date).subtract(1, 'day'),
            $lte: moment(post_date).add(1, 'day'),
        }
    }else if(post_range == 3) {
        post_query.createdAt = {
            $gte: moment(post_date).subtract(1, 'year'),
            $lte: moment(post_date).add(1, 'year'),
        }
    }

    return db.Posts.find(post_query)
    .select('+createdAt')
    .then((posts) => {
        return res.status(200).json({result: "success", posts}).end();
    }).catch((error) => console.log(error) || res.status(200).json({result:"error", errorCode: 0}).end());
};
