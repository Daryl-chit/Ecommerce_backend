const db = require('../../db');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    let { message_ids } = req.body;
    
    winston.info("Set message as read");
    winston.info(req.body);

    const user = req.session.user;

    for(let i = 0; i < message_ids.length; i += 1){
        message_ids[i] = db.mongoose.Types.ObjectId(message_ids[i]);
    }
    
    return db.Messages.update(
        {
            _id: { $in: message_ids},
            sender_id: user._id
        },
        {$set: {status: 2}}
    ).then(() => {
        return res.status(200).json({result: 'success', message_ids}).end();
    }).catch(error => console.log(error) || res.status(200).json({result: 'error', errorCode: 0}).end());
};
