const { merge, omit, isEmpty } = require('lodash');
const db = require('../../db');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    let { title, from_trip_date, to_trip_date, schedules, is_public, share_with } = req.body;
    const file = req.file;

    winston.info('Create a new trip plan');
    winston.info(title);

    const user = req.session.user;

    const trip_plan = {
        title, from_trip_date, to_trip_date, is_public,
        customer_id: user._id,
        trip_image: file?"\\" + file.path:null,
    }

    if(file) {
        const upload_media = {
            customer_id: user._id,
            media_name: title,
            media_type: 'image',
            type: 0
        }
    
        db.Uploads(upload_media).save();
    }

    return db.TripPlans(trip_plan).save()
    .then((row) => {
        if(share_with){
            let share_datas = [];
            for(let j = 0; j < share_with.length; j += 1) {
                const share_data = {
                    trip_id: row._id,
                    customer_id: user._id
                };
    
                share_datas.push(share_data);
            }
            db.ShareWith.insertMany(share_datas);
        }

        if(schedules){
            let trip_schedules = JSON.parse(schedules);

            for(let id = 0; id < trip_schedules.length; id += 1){
                merge(trip_schedules[id], {
                    trip_id: row._id,
                    customer_id: user._id
                });
            }
            return db.TripSchedules.insertMany(trip_schedules)
            .then((rows) => {
                row._doc.schedules = rows;
                return res.status(200).json({result: "success", data: row}).end();
            }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());    
        }
        return res.status(200).json({result: "success", data: row}).end();
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
