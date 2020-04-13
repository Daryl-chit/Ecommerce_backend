const db = require('../../db');
const { winston } = require('../../utils');
const moment = require('moment');

module.exports = (req, res) => {
    const {revenue_range, revenue_date} = req.query;

    winston.info('Get Revenue Data');
    winston.info(req.query);

    let revenue_query = {completed_at: {$ne: null}};
    revenue_query.createdAt = {
        $gte: moment(revenue_date).subtract(1, 'month'),
        $lte: moment(revenue_date).add(1, 'month')
    }
    if(revenue_range == 1){
        revenue_query.createdAt = {
            $gte: moment(revenue_date).subtract(1, 'day'),
            $lte: moment(revenue_date).add(1, 'day')
        }
    }else if(revenue_range == 3) {
        revenue_query.createdAt = {
            $gte: moment(revenue_date).subtract(1, 'year'),
            $lte: moment(revenue_date).add(1, 'year')
        }
    }
    
    return db.Transactions.find(revenue_query)
    .sort({completed_at: -1})
    .then((revenues) => {
        return res.status(200).json({result: "success", revenues}).end();
    }).catch((error) => console.log(error) || res.status(200).json({result:"error", errorCode: 0}).end());
};
