const db = require('../../db');
const { winston } = require('../../utils');
const moment = require('moment');

module.exports = (req, res) => {
    const {transaction_range, transaction_date} = req.query;

    winston.info('Get Transaction Data');
    winston.info(req.query);

    let transaction_query = {};

    transaction_query.createdAt = {
        $gte: moment(transaction_date).subtract(1, 'month'),
        $lte: moment(transaction_date).add(1, 'month')
    }
    if(transaction_range == 1){
        transaction_query.createdAt = {
            $gte: moment(transaction_date).subtract(1, 'day'),
            $lte: moment(transaction_date).add(1, 'day')
        }
    }else if(transaction_range == 3) {
        transaction_query.createdAt = {
            $gte: moment(transaction_date).subtract(1, 'year'),
            $lte: moment(transaction_date).add(1, 'year')
        }
    }
    
    return db.Transactions.find(transaction_query)
    .select('+createdAt')
    .then((transactions) => {
        return res.status(200).json({result: "success", transactions}).end();
    }).catch((error) => console.log(error) || res.status(200).json({result:"error", errorCode: 0}).end());
};
