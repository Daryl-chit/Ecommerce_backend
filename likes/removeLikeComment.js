const db = require('../../db');
const { winston } = require('../../utils');

module.exports = (req, res) => {
  const { id } = req.params;

  winston.info(`Remove a like comment by Id : ${id}`);

  if (!db.mongoose.Types.ObjectId.isValid(id)) {
    return res.status(200).json({ result: "error", errorCode: 133 }).end();
  }

  return db.Likes.findOneAndRemove({
    comment_id: id,
    customer_id: req.session.user._id
  }).then(() => res.status(200).json({result: "success", msg: "like comment removed"}).end())
  .catch(() => res.status(200).json({result: "error", errorCode: 0}).end());
};
