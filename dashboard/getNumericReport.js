const db = require('../../db');
const { winston } = require('../../utils');
const moment = require('moment');

module.exports = (req, res) => {
    const {numeric_report_date} = req.query;
    console.log(req.query);
    winston.info('Get Numeric Report Data');
    winston.info(req.query);

    const dau_query = {
        createdAt: {
            $gte: moment(numeric_report_date).subtract(1, 'day').toDate(),
            $gte: moment(numeric_report_date).toDate(),
        },
        type: 'active'
    };

    const mau_query = {
        createdAt: {
            $gte: moment(numeric_report_date).subtract(1, 'month').toDate(),
            $lte: moment(numeric_report_date).toDate(),
        },
        type: 'active'
    }

    const daily_session_query = {
        createdAt: {
            $gte: moment(numeric_report_date).subtract(1, 'day').toDate(),
            $lte: moment(numeric_report_date).toDate(),
        },
        type: 'login'
    }


    return Promise.all([
        db.UserLog.count(dau_query),
        db.UserLog.count(mau_query),
        db.UserLog.count(daily_session_query),
    ]).then(([dau, mau, daily_session]) => {
        const ds_per_users = dau === 0?0:(daily_session/dau).toFixed(2);
        const stickiness = mau === 0?0:((dau/mau) * 100).toFixed(2);

        return res.status(200).json({result: "success", dau, mau, ds_per_users, stickiness}).end();
    }).catch((error) => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
