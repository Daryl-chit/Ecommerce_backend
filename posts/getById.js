const db = require('../../db');

module.exports = (req, res) => {
  const { id } = req.params;

  if (!db.mongoose.Types.ObjectId.isValid(id)) {
    return res.status(200).json({ result: "error", errorCode: 133 }).end();
  }

  return Promise.all([
    db.Posts.findOne({ _id: id }),
    db.PostMedias.find({ post_id: id})
  ]).then(([post, post_medias]) => {
    Promise.resolve({post, post_medias});
    if (!post) {
      return res.status(200).json({ result: "error", errorCode: 133 }).end();
    }

    post.views = parseInt(post.views) + 1;
    post.save();

    return res.status(200).json({result: "success", data: {post, files: post_medias}}).end()
  }).catch(error => console.log(error) || res.status(200).end());
};
