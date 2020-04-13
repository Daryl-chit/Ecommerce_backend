const { merge, omit, isEmpty } = require('lodash');
const db = require('../../db');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    let {token} = req.params;

    winston.info('Accept trip invite');
    winston.info(token);

    const user = req.session.user;

    return db.Invites.findOne({
        invite_token: token
    }).then((invite) => {
        if(invite) {
            return db.TripPlans.findOne({
                _id: invite.trip_id
            }).then((trip) => {
                if(trip) {
                    let invites = [];
                    if(trip.invites) {
                        invites = trip.invites;
                    }

                    if(invites.find(el=>el === user._id)){
                        return res.status(200).json({result: "error", errorCode: 139}).end();
                    }

                    merge(trip, {
                        invites: invites
                    });
                    trip.save();

                    return res.status(200).json({result: "success", trip_id: invite.mode === 'view'?invite.trip_id:null}).end();
                }else {
                    return res.status(200).json({result: "error", errorCode: 1}).end();
                }
            }).catch((error) => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
        }else {
            return res.status(200).json({result: "error", errorCode: 1}).end();
        }
    }).catch((error) => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
