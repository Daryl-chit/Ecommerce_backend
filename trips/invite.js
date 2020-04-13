const db = require('../../db');
const { winston, hash, tokens } = require('../../utils');

module.exports = (req, res) => {
    let { mode, trip_id } = req.body;

    winston.info('Create a invite');
    winston.info(req.body);

    const user = req.session.user;

    if(mode !== 'edit' && mode !== 'view') {
        return res.status(200).json({result: "error", errorCode: 1}).end();
    }

    const salt = tokens.generate();
    const invite_token = hash.password(salt, trip_id);

    const invite = {
        mode: mode,
        trip_id: trip_id,
        invite_token: invite_token,
        customer_id: user._id,
    }

    return db.Invites(invite).save()
    .then(() => {
        const redirectLink = 'http://localhost/invite/' + invite_token;
        console.log({url: redirectLink, token: invite_token})
        return res.status(200).json({result: "success", data: {url: redirectLink, token: invite_token}}).end();
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
