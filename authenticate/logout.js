const db = require('../../db');
const { hash } = require('../../utils');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    const user = req.session.user;
    const headers = req.headers;

    winston.info('Logout from an account');
    winston.info(user);

    if(!headers['x-user-key'] || !headers['authorization']){
        return res.status(200).json({result: "error", errorCode: 3}).end();
    }

    const user_log = {
        customer_id: user._id,
        type: 'logout'
    };

    db.UserLog(user_log).save();

    return db.Customers.findOne({email: user.email})
      .then((existingUser) => {
        const device_token = headers['x-user-key'];
        const session_token = headers['authorization'];
        return db.UserTokens.findOne({
            user_id: existingUser._id,
            device_token: device_token
        }).then((user_token) => {
            if(session_token === hash.authentication(user_token.salt,existingUser._id)){
                return db.UserTokens.remove({_id: user_token._id})
                .then(() => res.status(200).json({result: "success"}).end())
                .catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
            }else{
                return res.status(200).json({result: "error", errorCode: 2}).end();
            }
        }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
      }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
