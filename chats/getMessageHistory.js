const db = require('../../db');
const { NUMBER_OF_ITEMS_PER_PAGE, DEFAULT_START_AT } = require('../../../common/constants');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    let { room_id, limit, start_at } = req.query;

    winston.info('Get Message History');
    winston.info(req.query);

    limit = Number(limit) || NUMBER_OF_ITEMS_PER_PAGE;
    start_at = Number(start_at) || DEFAULT_START_AT;

    const user = req.session.user;
    return db.ChatRooms.findOne({
        $and: [
            { _id: room_id },
            { $or: [
                {owner_id: user._id}, 
                {opponent_id: user._id}]
            }
        ]
    }).then((row) => {
        if(!row){
            return res.status(200).json({result: "error", errorCode: 131}).end();
        }

        let additionalParams = {
            limit: limit, // Ending Row
            sort:{
                createdAt: -1 //Sort by Date Added DESC
            }
        };
        if(start_at) {
            additionalParams.skip = start_at;
        }
        return Promise.all([
            db.Messages.find({
                room_id: room_id
            },
                ['room_id', 'sender_id', 'message', 'action', 'status', 'price', 'createdAt'],
                additionalParams
            ),
            db.Messages.count({room_id: room_id})  
        ]).then(([data, total]) => {
            Promise.resolve({data, total, start_at, limit});
            if(total < start_at)    
                start_at = null
            else
                start_at = parseInt(start_at) + parseInt(limit);
            return res.status(200).json({result: "success", data, limit, start_at, total}).end();
        }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end())
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end())
};
