const likePost = require('./likePost');
const likeTrip = require('./likeTrip');
const likeComment = require('./likeComment');
const removeLikeComment = require('./removeLikeComment');
const removeLikePost = require('./removeLikePost');
const removeLikeTrip = require('./removeLikeTrip');
const getLikePosts = require('./getLikePosts');

module.exports.likeComment = likeComment;
module.exports.likeTrip = likeTrip;
module.exports.likePost = likePost;
module.exports.removeLikeComment = removeLikeComment;
module.exports.removeLikePost = removeLikePost;
module.exports.removeLikeTrip = removeLikeTrip;
module.exports.getLikePosts = getLikePosts;