const { merge, omit, isEmpty } = require('lodash');
const db = require('../../db');
const { winston } = require('../../utils');
const moment = require('moment');

module.exports = (req, res) => {
    const {activity_users_range, app_downloads_range, app_shares_range, revenue_range} = req.body;

    winston.info('Get Report Data');
    winston.info(req.body);

    const current_date = moment();

    let login_user_query = {type: 'login'};
    let register_user_query = {type: 'register'};
    let before = current_date.subtract(1, 'month');
    if(activity_users_range === 1){
        before = current_date.subtract(1, 'day');
    }else if(activity_users_range === 3) {
        before = current_date.subtract(1, 'year');
    }
    login_user_query.createdAt = {
        $gte: before.toDate()
    },
    register_user_query.createdAt = {
        $gte: before.toDate()
    }

    let app_download_query = {};
    before = current_date.subtract(1, 'month');
    if(app_downloads_range === 1){
        before = current_date.subtract(1, 'day');
    }else if(app_downloads_range === 3) {
        before = current_date.subtract(1, 'year');
    }
    app_download_query.createdAt = {
        $gte: before.toDate()
    }

    let app_shares_query = {};
    before = current_date.subtract(1, 'month');
    if(app_shares_range === 1){
        before = current_date.subtract(1, 'day');
    }else if(app_shares_range === 3) {
        before = current_date.subtract(1, 'year');
    }
    app_shares_query.createdAt = {
        $gte: before.toDate()
    }

    let revenue_query = {};
    before = current_date.subtract(1, 'month');
    if(revenue_range === 1){
        before = current_date.subtract(1, 'day');
    }else if(revenue_range === 3) {
        before = current_date.subtract(1, 'year');
    }
    revenue_query.createdAt = {
        $gte: before.toDate()
    }

    return Promise.all([
        db.UserLog.find(login_user_query)
        .select('+createdAt'),
        db.UserLog.find(register_user_query)
        .select('+createdAt'),
        db.UserTokens
        .aggregate( [ { $group : { _id : "$user_id" }}, {$count: "total"} ] ),
        db.Customers.count({})
    ]).then(([active_users, new_users, active_counts, all_counts]) => {
        return res.status(200).json({result: "success", active_users, new_users, active_counts: active_counts[0].total, all_counts}).end();
    }).catch((error) => console.log(error) || res.status(200).json({result:"error", errorCode: 0}).end());
};
