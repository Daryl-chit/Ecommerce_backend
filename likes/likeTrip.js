const { merge, omit, isEmpty } = require('lodash');
const db = require('../../db');
const { hash, tokens } = require('../../utils');
const { roleTypes } = require('../../../common/constants');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    let { trip_id } = req.body;

    winston.info('Create a new like');
    winston.info(trip_id);

    return db.TripPlans.findOne({id: trip_id})
    .then((trip) => {
        if(!trip)
            return res.status(200).json({result: "error", errorCode: 31}).end();
        return db.Likes.findOne({customer_id: req.session.user.id, trip_id})
        .then((existLikes) => {
            if (existLikes) {
                return res.status(200).json({ result: "error", errorCode: 221 }).end();
            }
            
            const like = {
                customer_id: req.session.user.id,
                trip_id
            }
            return db.Likes(like).save()
                .then((data) => res.status(200).json({result: "success", msg: "Like succesed", _id: data._id}).end());
        }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 2}).end());
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 2}).end());
};
