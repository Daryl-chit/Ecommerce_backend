const db = require('../../db');
const { winston } = require('../../utils');
const moment = require('moment');

module.exports = (req, res) => {
    const {upload_range, upload_date} = req.query;

    winston.info('Get Upload Videos and Images');
    winston.info(req.query);

    let upload_video_query = {media_type: 'video'};
    let upload_image_query = {media_type: 'image'};

    upload_video_query.createdAt = {
        $gte: moment(upload_date).subtract(1, 'month').toDate(),
        $lte: moment(upload_date).add(1, 'month').toDate()
    }

    upload_image_query.createdAt = {
        $gte: moment(upload_date).subtract(1, 'month').toDate(),
        $lte: moment(upload_date).add(1, 'month').toDate()
    }
    if(upload_range == "1"){
        upload_video_query.createdAt = {
            $gte: moment(upload_date).subtract(1, 'day').toDate(),
            $lte: moment(upload_date).add(1, 'day').toDate()
        }
    
        upload_image_query.createdAt = {
            $gte: moment(upload_date).subtract(1, 'day').toDate(),
            $lte: moment(upload_date).add(1, 'day').toDate()
        }
    }else if(upload_range == "3") {
        upload_video_query.createdAt = {
            $gte: moment(upload_date).subtract(1, 'year').toDate(),
            $lte: moment(upload_date).add(1, 'year').toDate()
        }
    
        upload_image_query.createdAt = {
            $gte: moment(upload_date).subtract(1, 'year').toDate(),
            $lte: moment(upload_date).add(1, 'year').toDate()
        }
    }


    return Promise.all([
        db.Uploads.find(upload_video_query)
        .select('+createdAt'),
        db.Uploads.find(upload_image_query)
        .select('+createdAt'),
    ]).then(([upload_videos, upload_images]) => {
        return res.status(200).json({result: "success", upload_videos, upload_images}).end();
    }).catch((error) => console.log(error) || res.status(200).json({result:"error", errorCode: 0}).end());
};
