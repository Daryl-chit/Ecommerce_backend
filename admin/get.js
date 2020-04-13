const db = require('../../db');

module.exports = (req, res) => {
    const admin = req.session.admin;

    if(!admin)
        return res.status(500).json({result: "error", message: "Admin Authenticaion Invalid"}).end();

    return db.Admin.findOne({email: admin.email})
    .then((admin) => {
        return res.status(200).json({result: "success", admin}).end();
    }).catch((error) => console.log(error) || res.status(500).json({result: "error", message: "Internal Server Error"}).end());
};
