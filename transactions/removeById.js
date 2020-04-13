const db = require('../../db');
const { winston } = require('../../utils');

module.exports = (req, res) => {
  const { id } = req.params;

  winston.info(`Remove a trip plan by Id : ${id}`);

  if (!db.mongoose.Types.ObjectId.isValid(id)) {
    return res.status(200).json({ result: "error", errorCode: 32 }).end();
  }

  return Promise.all([
    db.TripPlans.findByIdAndRemove(id),
    db.TripSchedules.findOneAndRemove({trip_plan: id}),
    db.Posts.findOneAndRemove({trip_id: id})
  ]).then(() => {
      return res.status(200).json({result: "success", msg: "removed trip plan"}).end();
  }).catch(() => res.status(200).json({result: "error", errorCode: 0}).end());
};
