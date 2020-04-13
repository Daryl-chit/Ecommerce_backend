const db = require('../../db');
const { hash, tokens } = require('../../utils');
const { merge } = require('lodash');
const config = require('../../config');
const paths = require('../../../common/constants/paths');

module.exports = (req, res) => {
  const { verification_code, new_password } = req.body;

  return db.Customers.findOne({ "authentication.verification_code": verification_code })
    .then((customer) => {
      if (!customer) {
        return res.status(200).json({ result: 'error', errorCode: 130 }).end();
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
    .then(() => res.status(200).json({result: "success", msg: "reset password success"}).end())
    .catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 2}).end());
};
