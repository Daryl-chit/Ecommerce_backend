const db = require('../../db');
const { omit, merge, set } = require('lodash');
const { winston } = require('../../utils');
const moment = require('moment');

module.exports = (req, res) => {
  let query = req.body;
  const file = req.file;

  const { id } = req.params;

  winston.info(`Update a trip plan by Id : ${id}`);
  winston.info(query);
  
  let upload_media = null;
  if(file) {
    upload_media = {
        customer_id: req.session.user?req.session.user._id:'0',
        media_type: 'image',
        type: 0
    }
  }

  if (!db.mongoose.Types.ObjectId.isValid(id)) {
    return res.status(200).json({ result: "error", errorCode: 130 }).end();
  }

  if(query.schedules) {
      let schedules = JSON.parse(query.schedules);
      for(let id = 0; id < schedules.length; id += 1){
          if(schedules[id]._id && schedules[id]._id.length > 0){
              const _id = schedules[id]._id;
              let updateQuery = omit(schedules[id], ['_id']);
              updateQuery.updatedAt = moment().toDate();
              db.TripSchedules.update({_id: _id}, { $set: updateQuery })
              .then(() =>console.log('success to update trip schedule'))
              .catch((error) => console.log(error));
          }else{
              let new_schedules = omit(schedules[id], ['_id']);
              new_schedules.trip_id = id;
              db.TripSchedules(new_schedules).save()
              .then(() =>console.log('success to update trip schedule'))
              .catch((error) => console.log(error));
          }
      }

      query = omit(query, ['schedules']);
  }

  if(query.deleted_schedule_ids) {
    const deleted_schedule_ids = JSON.parse(query.deleted_schedule_ids);
    for(let tId = 0; tId < deleted_schedule_ids.length; tId += 1){
        db.TripSchedules.findByIdAndRemove(deleted_schedule_ids[tId]);
    }
    query = omit(query, ['deleted_schedule_ids']);
  }

  if(file) {
      merge(query, {
          trip_image: "\\" + file.path
      })
  }

  if(query.deleted_image) {
    set(query, 'trip_image', null);
    omit(query, ['deleted_image']);
  }

  return db.TripPlans.update({ _id: id }, { $set: query })
    .then(() => {
        return db.TripPlans.findOne({_id: id})
        .then((row) =>{
            if(upload_media) {
                upload_media.title = row.title;
                db.Uploads(upload_media).save();
            }
            return res.status(200).json({result: "success", data: row}).end();
        }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
