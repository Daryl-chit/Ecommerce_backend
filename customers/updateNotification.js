const db = require('../../db');
const { omit, merge } = require('lodash');
const { winston } = require('../../utils');

module.exports = (req, res) => {
  const settings = req.body;

  const { id } = req.params;

  winston.info(`Update a settings by Id : ${id}`);
  winston.info(settings);

  if (!db.mongoose.Types.ObjectId.isValid(id)) {
    return res.status(200).json({ result: "error", errorCode: 2 }).end();
  }

  return db.UserSettings.findOne({ customer_id: id })
    .then((currentSetting) => {
      if (!currentSetting) {
        return res.status(200).json({ result: "error", errorCode: 111 }).end();
      }

      merge(currentSetting, settings);

      if (db.UserSettings(currentSetting).validateSync()) {
        return res.status(200).json({ result: 'error', errorCode: 214 }).end();
      }

      return currentSetting.save()
        .then(() => res.status(200).json({result: "success"}).end());
    })
    .catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
