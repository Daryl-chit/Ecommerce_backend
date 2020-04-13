const { merge, omit, isEmpty } = require('lodash');
const db = require('../../db');
const { hash, tokens } = require('../../utils');
const { roleTypes } = require('../../../common/constants');
const { winston } = require('../../utils');

module.exports = (req, res) => {
  let user = req.body;
  const { headers } = req;

  winston.info('Create a new user');
  winston.info(user);

  if(!user.login_by)
    return res.status(400).json({ message: 'Invalid user data!' }).end();
  
  if(user.login_by === 'manual'){
    return db.Customers.findOne({email: user.email})
      .then((existingUser) => {
        if (existingUser) {
          return res.status(409).json({ message: 'Email already taken!' }).end();
        }
        
        const salt = tokens.generate();

        merge(user, {
          authentication: {
            salt,
            password: hash.password(salt, user.password),
          },
          login_by: 'manual'
        });

        return db.Customers(user).save()
          .then(() => res.status(200).end());
      })
      .catch(error => console.log(error) || res.status(200).end());
  }else if(user.login_by === 'google') {

  }else if(user.login_by === 'facebook'){

  }else{
    return res.status(400).json({ message: 'Invalid login request!' }).end();
  }
};
