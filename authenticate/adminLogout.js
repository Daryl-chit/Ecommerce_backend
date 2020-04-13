const { winston } = require('../../utils');
const paths = require('../../../common/constants/paths');

module.exports = (req, res) => {
    const admin = req.session.admin;

    winston.info('Logout admin from an account');
    winston.info(admin);

    req.session.admin = null;
    return res.status(200).json({result: "success"}).end();
};
