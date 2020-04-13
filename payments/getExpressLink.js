const db = require('../../db');
const { winston, stripe } = require('../../utils');

module.exports = (req, res) => {
    winston.info("Create Express Login link");
    const user = req.session.user;

    return db.StCustomers.findOne({customer_id: user._id})
    .then((st_customer) => {
        if(st_customer.account_id) {
            stripe.createLoginLink(st_customer.account_id)
            .then((link_object) => {
                const {url} = link_object;
                return res.status(200).json({result: "success", account_id: st_customer.account_id, link: url}).end();
            }).catch((error) => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end())
        }else {
            return res.status(200).json({result: "success", account_id: null}).end();
        }
    }).catch(err => { console.error("stripeTransfer Error: ", err); return res.status(200).json({result: "error", errorCode:0}); });
};
