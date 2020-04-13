const { omit, merge } = require('lodash');
const db = require('../../db');

module.exports = (req, res) => {
    const {fcm_token} = req.body;
    const headers = req.headers;
    console.log('Check fcm token save')
    console.log(fcm_token)
    if(!headers['x-user-key']){
        return res.status(200).json({result: "success", errorCode: 2}).end();
    }

    const device_token = headers['x-user-key'];
    const user = req.session.user;

    return db.UserTokens.findOne({
      user_id: user._id,
      device_token: device_token
    }).then((user_token) => {
        if(!user_token) {
            return res.status(200).json({result: "error", errorCode: 1}).end();
        }

        merge(user_token, {
            fcm_token: fcm_token
        });
        return user_token.save()
        .then(() => res.status(200).json({result: "success"}).end())
        .catch((error) => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
    }).catch((error) => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};

