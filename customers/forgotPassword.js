const db = require('../../db');
const { tokens } = require('../../utils');
const { merge } = require('lodash');
const config = require('../../config');
const paths = require('../../../common/constants/paths');

module.exports = (req, res) => {
    const { email } = req.body;
    const verification_code = tokens.generate(7);

    return db.Customers.findOne({ email: email })
        .then((customer) => {
            if (!customer) {
                return res.status(200).json({result: "error", errorCode: 130 }).end();
            }

            merge(customer, { authentication: { verification_code } });

            return db.Customers(customer).save();
        })
        .then((customer) => {
        return aws.sendEmail({
            to: customer.email,
            subject: 'Forgot Password Request',
            text: `Verfication Code: ${verification_code}`,
            html: `
            <table style="margin:auto; max-width:480px;">
                <thead>
                <tr>
                <td>Forgot Password Request</td>
                </tr>
                </thead>
                <tbody>
                <tr>
                <td>Link: ${verification_code}</td>
                </tr>
                </tbody>
            </table>
        `,
        });
        })
        .then(() => res.status(200).json({result: "success", msg: "Check verification in email"}).end())
        .catch(() => res.status(200).json({result: "error", errorCode: 2}).end());
};
