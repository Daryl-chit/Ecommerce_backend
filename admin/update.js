const db = require('../../db');
const { merge } = require('lodash');

module.exports = (req, res) => {
    const query = req.body;
    const admin = req.session.admin;
    const file = req.file;

    console.log("Admin Info Update Request")

    if(!admin)
        return res.status(500).json({result: "error", message: "Admin Authenticaion Invalid"}).end();
    
    return db.Admin.findOne({email: admin.email})
    .then((admin) => {
        if(file){
            merge(query, {
              avatar: "\\"  + file.path
            });  
        }
    
        merge(admin, query);
        admin.save()
        .then(() => {
            return res.status(200).json({result: "success", data: admin}).end();
        }).catch((error) => console.log(error) || res.status(500).json({result: "error", msg: "Internal Server Error"}).end());
    }).catch((error) => console.log(error) || res.status(500).json({result: "error", msg: "Internal Server Error"}).end());
};
