const { merge, omit, isEmpty } = require('lodash');
const db = require('../../db');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    const { id } = req.params
    const query = req.body;
    
    winston.info('update a transaction');

    if (!db.mongoose.Types.ObjectId.isValid(id)) {
        return res.status(200).json({ result: "error", errorCode: 0 }).end();
    }

    return db.Transactions.update(
        {_id: id},
        {$set: {query}}
    ).then((transaction) => {
        if(!transaction) {
            return res.status(200).json({result: "error", errorCode: 0}).end();
        }
        return res.status(200).json({result: "success", transaction: transaction}).end();
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 2}).end());
};
