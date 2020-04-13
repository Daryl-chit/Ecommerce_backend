const db = require('../../db');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const { winston, google } = require('../../utils');

module.exports = (req, res) => {
    const { title, description, price, currency, trip_id, time_limit, location, final_location, schedule_id, share_with } = req.body;
    const mediaInfo = req.files;

    winston.info('Create a new post');

    const user = req.session.user;
    const post = {
        customer_id: user._id,
        trip_id, title, description, price, currency, time_limit,
        location: location?JSON.parse(location):null,
        final_location: final_location?JSON.parse(final_location):null,
        schedule_id: schedule_id,
        view_counts: 0
    };

    db.UserTracks.findOne({
        customer_id: user._id
    }).then(async(user_track) => {
        if(user_track) {
            try{
                const lng = user_track.location.coordinates[0];
                const lat = user_track.location.coordinates[1];
                const response = await google.getAddressByLocation(lat, lng);
                const {address_components} = response.json.results[0];

                let country = '';
                let city = '';
                address_components.map((item) => {
                    if(item.types[0] === 'country'){
                        country = item.long_name;
                    }
                    if(item.types[0] === 'locality') {
                        city = item.long_name;
                    }
                });

                const country_posts = await db.CountryPost.find({country, city});

                let country_post = country_posts.find(function(item) {
                    if(item.country === country && item.city === city){
                        return true;
                    }else{
                        return false;
                    }
                });

                if(country_post) {
                    await db.CountryPost.update({_id: country_post._id}, {$set: {post_count: parseInt(country_post.post_count, 10) + 1}})
                }else {
                    country_post = {
                        country: country,
                        city: city,
                        post_count: 1
                    };
                    await db.CountryPost(country_post).save()
                }


            }catch(error) {
                console.log(error);
            }
        }
    })

    console.log('post create 1')
    return db.Posts(post).save()
    .then((row) => {
        console.log('post create 2')
        if(share_with){
            let share_datas = [];
            for(let j = 0; j < share_with.length; j += 1) {
                const share_data = {
                    post_id: row._id,
                    customer_id: user._id
                };
    
                share_datas.push(share_data);
            }
            db.ShareWith.insertMany(share_datas);
        }
        console.log('post create 3')
        if(mediaInfo){
            let post_medias = [];
            let upload_medias = [];
            for(let i = 0; i < mediaInfo.length; i += 1) {
                let upload_media = {
                    customer_id: user._id,
                    media_name: title,
                    type: 1
                }

                if(mediaInfo[i].mimetype.includes('video')) {
                    upload_media.media_type = 'video';

                    const thumbnail = '\\static\\uploads\\thumbnails\\' + path.parse(mediaInfo[i].filename).name +".png";

                    ffmpeg(mediaInfo[i].path)
                    .screenshots({
                        timestamps: ['50%'],
                        filename: path.parse(mediaInfo[i].filename).name +".png",
                        folder: 'static/uploads/thumbnails',
                        size: '320x240'
                    });

                    post_media = {
                        post_id: row._id,
                        media_file: "\\" + mediaInfo[i].path,
                        media_type: "video",
                        thumbnail: thumbnail,
                    };
                }else{
                    upload_media.media_type = 'image';
                    post_media = {
                        post_id: row._id,
                        media_file: "\\" + mediaInfo[i].path,
                        media_type: mediaInfo[i].mimetype.includes('image')?"image":"file"
                    };
                }
                post_medias.push(post_media);
                upload_medias.push(upload_media);
            }

            db.Uploads.insertMany(upload_medias);
            console.log('post create 4')
            db.PostMedias.insertMany(post_medias)
            .then((rows) => {
                row._doc.mediaInfo = rows;
                return res.status(200).json({result: "success", data: row}).end();
            });
        }else{
            console.log('post create 5')
            return res.status(200).json({result: "success", data: row}).end()
        }
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 2}).end());
};
