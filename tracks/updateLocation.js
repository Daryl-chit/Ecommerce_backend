const db = require('../../db');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    const { location } = req.body;
    
    winston.info('update a user location');
    console.log(location);

    const user = req.session.user;

    return db.UserTracks.findOne({customer_id: user._id})
    .then((user_track) => {
        if(user_track){
            user_track.location = {
                type: "Point",
                coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)]
            };
            return db.UserTracks(user_track).save()
            .then((track) => res.status(200).json({result: "success", data: track}).end());
        }else{
            const new_track = {
                customer_id: req.session.user._id,
                location: {
                    type: "Point",
                    coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)]
                }
            };

            return db.UserTracks(new_track).save()
            .then((track) => res.status(200).json({result: "success", data: track}).end());
        }
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 2}).end());
};
