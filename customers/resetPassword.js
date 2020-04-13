const db = require('../../db');
const md5 = require('md5');
const { hash, tokens } = require('../../utils');
const { merge } = require('lodash');

module.exports = (req, res) => {
  const { customer_id, password } = req.body;

  console.log("Reset Password");
  console.log(req.body);

  return db.Customers.findOne({ _id: customer_id })
  .then((customer) => {
    if (!customer) {
      return res.status(200).json({ result: 'error', errorCode: 130 }).end();
    }

    const salt = tokens.generate();
    const md5_pwd = md5(password);
    merge(customer, {
      authentication: {
        salt,
        password: hash.password(salt, md5_pwd.toUpperCase()),
        verfication_code: null
      },
    });

    console.log(customer)
    return customer.save()
    .then(() => res.status(200).json({result: "success", message: "Reset password success"}).end())
    .catch(error => console.log(error) || res.status(200).json({result: "error", message: "Internal Server Error"}).end());
  }).catch(error => console.log(error) || res.status(200).json({result: "error", message: "Internal Server Error"}).end());
};
