const { merge } = require('lodash');
const db = require('../../db');
const { stripe, winston } = require('../../utils');

module.exports = (req, res) => {
  let {customer_id} = req.body;

  winston.info('Disconnect customer with stripe');
  winston.info(customer_id);

  if (!db.mongoose.Types.ObjectId.isValid(customer_id)) {
    return res.status(200).json({ result: "error", message: "Invalid Request" }).end();
  }

  return db.Customers.findOne({
      _id: customer_id
  }).then((customer) => {
    if(!customer) {
        return res.status(200).json({result: "error", message: "Invalid Request"}).end();
    }

    return db.StCustomers.findOne({customer_id})
    .then((st_customer) => {
        if(!st_customer) {
            return res.status(200).json({result: "error", message: "Invalid Request"}).end();
        }

        if(!st_customer.account_id){
            return res.status(200).json({result: "error", message: "Already disconnected"}).end();
        }

        return stripe.deleteCustomer(st_customer.account_id)
        .then(() => {
            merge(st_customer, {
                account_id: null
            });
            return st_customer.save()
            .then(() => res.status(200).json({result: "success", message: "Customer was disconnected successfully"}).end());
        }).catch((error) => console.log(error) || res.status(500).json({result: "error", message: "Internal Server"}).end())
    }).catch((error) => console.log(error) || res.status(500).json({result: "error", message: "Internal Server"}).end())
  }).catch((error) => console.log(error) || res.status(500).json({result: "error", message: "Internal Server"}).end())
};
