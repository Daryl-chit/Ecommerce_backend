const db = require('../../db');
const { hash, tokens } = require('../../utils');
const { merge } = require('lodash');

module.exports = (req, res) => {
    const { current_password, new_password } = req.body;

    const admin = req.session.admin;
    return db.Admin.findOne({ "email": admin.email })
    .select('+authentication.password +authentication.salt')
    .then((row) => {
        if (!row) {
            return res.status(500).json({ result: 'error', message: "Reset password was failed" }).end();
        }

        const salt = row.authentication.salt;
        if(hash.password(salt, current_password) === row.authentication.password){
            merge(row, {
                authentication: {
                    salt,
                    password: hash.password(salt, new_password)
                }
            });

            return row.save()
            .then(() => {
                return res.status(200).json({result: "success", message: "Reset password success"}).end();
            }).catch(error => console.log(error) || res.status(500).json({result: "error", message: "Reset password was failed"}).end());
        }else {
            return res.status(500).json({result: "error", message: "Reset password was failed"}).end();
        }
    }).catch(error => console.log(error) || res.status(500).json({result: "error", message: "Reset password was failed"}).end());
};
