const db = require('../../db');
const { merge } = require('lodash');

module.exports = (req, res) => {
  const { id } = req.params;

  if (!db.mongoose.Types.ObjectId.isValid(id)) {
    return res.status(200).json({ result: "error", errorCode: 2 }).end();
  }

  return db.UserSettings.findOne({ customer_id: id })
    .then((setting) => {
      if (!setting) {
        return res.status(200).json({ result: "error", errorCode: 111 }).end();
      }

      return res.status(200).json({ result: "success", data: setting }).end();
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
