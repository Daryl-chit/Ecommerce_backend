const db = require('../../db');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    const { post_id, trip_id, comment } = req.body;

    winston.info('Add comment to post');
    winston.info(req.body);

    const user = req.session.user;

    const new_comment = {
        post_id, trip_id,
        customer_id: user._id,
        comment
    };
    return db.Comments(new_comment).save()
    .then((row) => {
        return res.status(200).json({result: "success", data: row}).end();
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end())    
};