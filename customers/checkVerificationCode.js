const db = require('../../db');

module.exports = (req, res) => {
    const { verification_code } = req.body;
    
    return db.Customers.findOne({ 'authentication.verification_code': verification_code })
    .then((customer) => {
      if (!customer) {
        return res.status(200).json({ result: "error", errorCode: 130 }).end();
      }

      return res.status(200).json({result: "success", msg: "verificaiton success"}).end();
    })
    .catch(() => res.status(200).json({result: "error", errorCode: 2}).end());
};
