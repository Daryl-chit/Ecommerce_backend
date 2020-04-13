const db = require('../../db');
const { omit, merge } = require('lodash');
const { winston } = require('../../utils');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

module.exports = (req, res) => {
    let query = req.body;
    const files = req.files;

    const { id } = req.params;

    winston.info(`Update a post by Id : ${id}`);
    winston.info(query);

    if (!db.mongoose.Types.ObjectId.isValid(id)) {
        return res.status(200).json({ result: "error", errorCode: 130 }).end();
    }

    let remove_medias = null;
    if(query.remove_media_ids && query.remove_media_ids !== "[]") {
        remove_medias = query.remove_media_ids.substring(1, query.remove_media_ids.length - 1).split(',');
        remove_medias.map((item, key) =>{
            remove_medias[key] = db.mongoose.Types.ObjectId(item);
        })
        query = omit(query, ['remove_media_ids']);
    }

    if(query.location) {
        query.location = JSON.parse(query.location);
    }

    if(query.final_location) {
        query.final_location = JSON.parse(query.final_location);
    }

    return db.Posts.update({ _id: id }, { $set: query })
    .then(() => {
        if(remove_medias){
            db.PostMedias.deleteMany({_id: { $in: remove_medias}})
            .then(() =>console.log("success"))
            .catch((error) => console.log(error))
        }
        if(files){
            let post_medias = [];
            let upload_medias = [];
            for(let i = 0; i < files.length; i += 1){
                let upload_media = {
                    customer_id: req.session.user?req.session.user._id:'0',
                    type: 1
                }
                let post_media = null;
                if(files[i].mimetype.includes('video')) {
                    upload_media.media_type = 'video';
                    
                    const thumbnail = '\\static\\uploads\\thumbnails\\' + path.parse(files[i].filename).name +".png";
                    ffmpeg(files[i].path)
                    .screenshots({
                        timestamps: ['50%'],
                        filename: path.parse(files[i].filename).name +".png",
                        folder: 'static/uploads/thumbnails',
                        size: '320x240'
                    });

                    post_media = {
                        post_id: id,
                        media_file: "\\" + files[i].path,
                        media_type: "video",
                        thumbnail: thumbnail,
                    };
                }else{
                    upload_media.media_type = 'image';
                    post_media = {
                        post_id: id,
                        media_file: "\\" + files[i].path,
                        media_type: files[i].mimetype.includes('image')?"image":"file"
                    };
                }
                upload_medias.push(upload_media);
                post_medias.push(post_media);
            }

            db.PostMedias.insertMany(post_medias)
            .then(() => {
                return Promise.all([
                    db.Posts.findOne({ _id: id }),
                    db.PostMedias.find({ post_id: id})
                ]).then(([post, post_medias]) => {
                    post.mediaInfo = post_medias;

                    for(let i = 0; i < upload_medias.length; i += 1){
                        upload_medias[i].title = post.title;
                    }
                    
                    db.Uploads.insertMany(upload_medias);

                    return res.status(200).json({result: "success", data: post}).end()
                }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
            }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
        }else{
            return Promise.all([
                db.Posts.findOne({ _id: id }),
                db.PostMedias.find({ post_id: id})
            ]).then(([post, post_medias]) => {
                post.mediaInfo = post_medias;
                return res.status(200).json({result: "success", data: post}).end()
            }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
        }
    }).catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
