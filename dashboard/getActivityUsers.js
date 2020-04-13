const db = require('../../db');
const { winston } = require('../../utils');
const moment = require('moment');

module.exports = (req, res) => {
    const {activity_users_range, activity_users_date} = req.query;

    winston.info('Get Activity Users');
    winston.info(req.query);

    let login_user_query = {type: 'login'};
    let register_user_query = {type: 'register'};
    
    login_user_query.createdAt = {
        $gte: moment(activity_users_date).subtract(1, 'month').toDate(),
        $lte: moment(activity_users_date).add(1, 'month').toDate()
    };

    register_user_query.createdAt = {
        $gte: moment(activity_users_date).subtract(1, 'month').toDate(),
        $lte: moment(activity_users_date).add(1, 'month').toDate()
    };

    if(activity_users_range === 1){
        login_user_query.createdAt = {
            $gte: moment(activity_users_date).subtract(1, 'day').toDate(),
            $lte: moment(activity_users_date).add(1, 'day').toDate()
        };
    
        register_user_query.createdAt = {
            $gte: moment(activity_users_date).subtract(1, 'day').toDate(),
            $lte: moment(activity_users_date).add(1, 'day').toDate()
        };
    }else if(activity_users_range === 3) {
        login_user_query.createdAt = {
            $gte: moment(activity_users_date).subtract(1, 'year').toDate(),
            $lte: moment(activity_users_date).add(1, 'year').toDate()
        };
    
        register_user_query.createdAt = {
            $gte: moment(activity_users_date).subtract(1, 'year').toDate(),
            $lte: moment(activity_users_date).add(1, 'year').toDate()
        };
    }

    return Promise.all([
        db.UserLog.find(login_user_query)
        .select('+createdAt'),
        db.UserLog.find(register_user_query)
        .select('+createdAt')
    ]).then(([active_users, new_users]) => {
        return res.status(200).json({result: "success", active_users, new_users}).end();
    }).catch((error) => console.log(error) || res.status(200).json({result:"error", errorCode: 0}).end());
};
