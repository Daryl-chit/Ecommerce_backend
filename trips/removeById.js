const db = require('../../db');
const { winston } = require('../../utils');

module.exports = (req, res) => {
  const { id } = req.params;

  winston.info(`Remove a trip plan by Id : ${id}`);

  if (!db.mongoose.Types.ObjectId.isValid(id)) {
    return res.status(200).json({ result: "error", errorCode: 32 }).end();
  }

  return db.TripPlans.findOne({_id: id})
  .then((trip_plan) => {
    if(trip_plan){
      return db.Posts.findOne({trip_id: id})
      .then((post) => {
        if(post) {
          return res.status(500).json({result: "error", errorCode: 1, message: "There is a post item on this trip. You cannot delete this trip"}).end();    
        }else{
          return Promise.all([
            db.TripPlans.findByIdAndRemove(id),
            db.TripSchedules.findOneAndRemove({trip_plan: id}),
            // db.Posts.findOneAndRemove({trip_id: id})
          ]).then(() => {
              return res.status(200).json({result: "success", message: "Removed trip plan successfully"}).end();
          }).catch((error) => console.log(error) || res.status(200).json({result: "error", errorCode: 0, message: "Internal Server Error"}).end());
        }
      })
    }else {
      return res.status(500).json({result: "error", errorCode: 1, message: "There is no trip plan"}).end();
    }
  }).catch((error) => console.log(error) || res.status(500).json({result: "error", errorCode: 0, message: "Internal Server Error"}).end());
}; 
