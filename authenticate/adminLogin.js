const db = require('../../db');
const {omit} = require('lodash');
const moment = require('moment');
const { hash, tokens, validation } = require('../../utils');

module.exports = (req, res) => {
    const { email, password } = req.body;

    console.log("Admin Login Request");
    console.log(req.body)

    if(!validation.isValidEmail(email)){
      return res.status(200).json({result: "error", errorCode: 11}).end();
    }
  
    if(validation.isEmpty(password)) {
      return res.status(200).json({result: "error", errorCode: 12}).end();
    }

    
    return db.Admin.count()
    .then((count) => {
        if(count > 0) {
            return db.Admin.findOne({email: email})
            .select('+authentication.password +authentication.salt')
            .then((row) => {
                if(!row)
                    return res.status(200).json({result: "error", msg: "Admin Login Failed"}).end();
        
                const salt = row.authentication.salt;
                if(row.authentication.password === hash.password(salt, password)){
                    
                    return db.Admin.update({_id: row._id}, {$set: {login_status: true, updatedAt: moment()}})
                    .then(() => {
                        row.authentication = omit(row.authentication, ['salt', 'password']);
                        req.session.admin = row;
                        return res.status(200).json({result: "success", data: row}).end();
                    }).catch((error) => console.log(error) || res.status(200).json({result: "error", msg: "Internal Server Error"}).end());  
                }else{
                    return res.status(200).json({result: "error", msg: "Admin Login Failed"}).end();
                }
            }).catch((error) => console.log(error) || res.status(200).json({result: "error", msg: "Internal Server Error"}).end());
        }else{
            const salt = tokens.generate();
            let admin = {
                email: email,
                login_status: true,
                authentication: {
                    salt,
                    password: hash.password(salt, password),
                }
            };

            return db.Admin(admin).save()
            .then((row) => {
                row.authentication = omit(row.authentication, ['salt', 'password']);
                req.session.admin = row;
                return res.status(200).json({result: "success", data: row}).end();
            }).catch((error) => console.log(error) || res.status(200).json({result: "error", msg: "Internal Server Error"}).end());
        }
    }).catch((error) => console.log(error) || res.status(200).json({result: "error", msg: "Internal Server Error"}).end());
};
