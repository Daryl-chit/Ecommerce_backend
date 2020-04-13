const { merge, omit, isEmpty } = require('lodash');
const db = require('../../db');
const { hash, tokens } = require('../../utils');
const { winston } = require('../../utils');

module.exports = (req, res) => {
    let user = req.body;

    winston.info('Create a new user');
    winston.info(user);

    return db.Customers.findOne({email: user.email})
      .then((existingUser) => {
        if (existingUser) {
          return res.status(200).json({ result: "error", errorCode: 112 }).end();
        }
        
        const salt = tokens.generate();

        merge(user, {
          authentication: {
            salt,
            password: hash.password(salt, user.password),
          },
          login_by: 'email',
          display_name: user.username
        });

        if (db.Customers(user).validateSync()) {
            return res.status(200).json({ result: "error", errorCode: 2 }).end();
        }

        return db.Customers(user).save()
          .then((row) => {
            const user_log = {
              customer_id: row._id,
              type: 'register'
            };

            const notification = {
              customer_id: row._id,
              new_follower: true,
              direct_messages: true,
              likes: true,
              comments: true,
              friend_trip_post: true,
              trip_plan_change: true,
              coming_near_you: true,
              invite_trip_plan: true
            };
            db.UserLog(user_log).save();
            db.UserSettings(notification).save();

            res.status(200).json({ result: "success", data:row}).end()
          });
      })
      .catch(error => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};
