const db = require('../../db');
const { merge } = require('lodash');
const { hash, tokens } = require('../../utils');

module.exports = (req, res) => {
  const { current_password, new_password } = req.body;

  const user = req.session.user;

  if (!db.mongoose.Types.ObjectId.isValid(user.id)) {
    return res.status(404).json({ message: 'User not found' }).end();
  }

  return db.Customers.findOne({ "authentication.verification_code": verification_code })
    .select('+authentication.password +authentication.salt')
    .then((customer) => {
      if (!customer) {
        return res.status(200).json({ result: 'error', errorCode: 110 }).end();
      }

      const { salt, password } = customer.authentication;

      if(hash.password(salt, current_password) !== password){
        return res.status(200).json({result: "error", errorCode: 215}).end();
      }
      const salt = tokens.generate();

      merge(customer, {
        authentication: {
          salt,
          password: hash.password(salt, new_password),
          verfication_code: null
        },
      });

      return customer.save();
    })
    .then(() => res.status(200).json({result: "success", msg: "update password success"}).end())
    .catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
