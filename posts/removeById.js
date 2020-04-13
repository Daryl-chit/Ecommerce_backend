const db = require('../../db');
const { winston } = require('../../utils');
const moment = require('moment');

module.exports = (req, res) => {
  const { id } = req.params;

  winston.info(`Remove a post by Id : ${id}`);

  if (!db.mongoose.Types.ObjectId.isValid(id)) {
    return res.status(200).json({ result: "error", errorCode: 133 }).end();
  }

  return db.Posts.findOne({
    _id: id
  }).then((post) => {
    if(post) {
      //check post item in transaction status or not
      return db.Transactions.findOne({
        post_id: id,
        $or: [{ status: 1 },{ status: 2 }, { status: 3 }, { status: 5 }]
      }).then((transaction) => {
        if(transaction) {
          return res.status(409).json({result: "error", errorCode: 199, message: "Post item is in transaction status. You cannot delete this item"}).end();
        }else {
          return db.Posts.findByIdAndRemove(id)
          .then(() => {
            return res.status(200).json({result: "success", message: "Post item removed successfully."}).end();
          }).catch(() => res.status(500).json({result: "error", errorCode: 0, message: "Internal Server Error"}).end());
        }
      }).catch(() => res.status(500).json({result: "error", errorCode: 0, message: "Internal Server Error"}).end());
    }else {
      return res.status(500).json({result: "error", errorCode: 1, message: "Post item doesn't exist"}).end()
    }
  }).catch(() => res.status(500).json({result: "error", errorCode: 0, message: "Internal Server Error"}).end());
};
