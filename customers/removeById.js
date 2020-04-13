const db = require('../../db');
const { winston } = require('../../utils');

module.exports = (req, res) => {
  const { id } = req.params;

  winston.info(`Remove a user by Id : ${id}`);

  if (!db.mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: 'User not found' }).end();
  }

  return db.Customers.findByIdAndRemove({ _id: id })
    .then(() => res.status(200).end())
    .catch(() => res.status(404).end());
};
