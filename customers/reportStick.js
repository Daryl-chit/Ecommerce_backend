const db = require('../../db');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    const { customer_id } = req.body;

    winston.info(`Report to server the customer is closing app now`);

    if (!db.mongoose.Types.ObjectId.isValid(customer_id)) {
        return res.status(200).json({result: "error",  }).end();
    }

    return db.Customers.findOne({ _id: customer_id })
    .then((customer) => {
        if(!customer)
            return res.status(200).json({result: "error", errorCode: 1}).end();
            
        const user_log = {
                customer_id: customer._id,
                type: 'stick'
            };
        return db.UserLog(user_log).save()
        .then(() => {
            return res.status(200).json({result: "success"}).end();
        }).catch(() => res.status(200).json({result: "error", errorCode: 0}).end());
    }).catch(() => res.status(200).json({result: "error", errorCode: 0}).end());
};
