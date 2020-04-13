const { omit, merge } = require('lodash');
const config = require('../../config');
const db = require('../../db');
const moment = require('moment');
const { build, hash, tokens, validation } = require('../../utils');
const { OAuth2Client } = require( 'google-auth-library' );
var fetch = require( 'node-fetch' );

module.exports = (req, res) => {
  const headers = req.headers;
  if(!headers['x-user-key']){
    return res.status(200).json({result: "error", errorCode: 2}).end();
  }

  const { email, password } = req.body;

  let username = null;
  if(!validation.isValidEmail(email)){
    username=email;
  }

  if(validation.isEmpty(password)) {
    return res.status(200).json({result: "error", errorCode: 12}).end();
  }

  const where = username? {username: username}:{email:email};

  return db.Customers.findOne(where)
  .select('+authentication.password +authentication.salt +loginCount')
  .then((customer) => {
    if(!customer)
      return res.status(200).json({result: "error", errorCode: 110}).end();

    return db.UserTokens.findOne({
      user_id: customer._id
    }).then((user_token) => {
      const salt = customer.authentication.salt;
      if(customer.authentication.password === hash.password(salt, password)){
        customer.authentication = omit(customer.authentication, ['salt', 'password']);
        const user_id = customer._id;
        const device_token = headers['x-user-key'];
        const salt = tokens.generate();
        const session_token = hash.authentication(salt, customer._id);
  
        const lastLoginTime = moment();
        const loginCount = customer.loginCount + 1;
        if(!user_token){
          return Promise.all([
            db.UserTokens.create({user_id, device_token, salt, session_token, login_by: 'email'}),
            db.Customers.update({_id: customer._id}, {$set: {lastLoginTime: lastLoginTime, loginCount: loginCount}})
          ])
          .then(() => {
            customer.lastLoginTime = lastLoginTime;
            customer.loginCount = loginCount;
            req.session.user = customer;
            return res.status(200).json({result: "success", data: customer, token: session_token}).end();
          }).catch((error) => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());  
        }else{
          merge(user_token, {
            user_id, device_token, salt, session_token, login_by: 'email'
          });
          const user_log = {
            customer_id: customer._id,
            type: 'login'
          };
          return Promise.all([
            db.UserLog(user_log).save(),
            db.UserTokens(user_token).save(),
            db.Customers.update({_id: customer._id}, {$set: {lastLoginTime: lastLoginTime, loginCount: loginCount}})
          ])
          .then(() => {
            customer.lastLoginTime = lastLoginTime;
            customer.loginCount = loginCount;
            req.session.user = customer;
            return res.status(200).json({result: "success", data: customer, token: session_token}).end();
          }).catch((error) => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());  

        }
      }else{
        return res.status(200).json({result: "error", errorCode: 215}).end();
      }
    }).catch((error) => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
  }).catch((error) => console.log(error) || res.status(200).json({result: "error", errorCode: 0}).end());
};

function emailLogin(email, password) {
  return db.Customers.findOne({email: email})
    .select('+authentication.password +authentication.salt +loginCount')
    .then((customer) => {
      if(!customer)
        return null;

      const salt = customer.authentication.salt;
      if(customer.authentication.password === hash.password(salt, password)){
        customer.authentication = omit(customer.authentication, ['salt', 'password']);
        return customer;
      }
    }).catch(error => {
      return null;
    });
}

function facebookLogin(req, res) {
  const { code } = req.body;
    //login as a facebook app to get an "app token"
  return fetch( config.facebookConfig.appAccessTokenLink, { method: 'GET' } )
  .then( response => response.json() )
  .then( response => {
    const appToken = response.access_token;
    //validate "social token", must pass the "app token"
    return fetch( config.facebookConfig.validateSocialTokenLink + '?input_token=' + code + '&access_token=' + appToken, {
        method: 'GET',
    } )
  } )
  .then( response => response.json() )
  .then( response => {
    //check the audience of the token
    const { app_id, is_valid, user_id } = response.data
    if ( app_id !== client_id ) {
      return res.status(200).json({message: "Internal Server Error"}).end();
    }
    //check if the token is valid
    if ( !is_valid ) {
      return res.status(200).json({message: "Token is not valid"}).end();
    }
    //get user profile using the app token
    return fetch( getProfileLink + user_id + '?fields=id,name,picture,email&access_token=' + appToken, {
        method: 'GET',
    } )

  } )
  .then( response => response.json() )
  .then( response => {
  // return the user profile
      const { id, picture, email, name } = response;
      let user = {
          name: name,
          pic: picture.data.url,
          id: id,
          email_verified: true,
          email: email
      }
      return res.status(200).json({});
  } )
//throw an error if something goes wrong
  .catch( err => {
      console.log(err);
      return res.status(200).json({message: "Internal Server Error"}).end();
  } );
}

function googleLogin() {
  let client = new OAuth2Client( config.googleConfig.appId, '', '' );

  return client.verifyIdToken( { idToken: code, audience: config.googleConfig.appId } )
  .then( login => {
      //if verification is ok, google returns a jwt
      var payload = login.getPayload();
      var userid = payload['sub'];

      //check if the jwt is issued for our client
      var audience = payload.aud;
      if ( audience !== GOOGLE_CLIENT_ID ) {
        return res.status(200).json({message: "Google user authenticating eeror"}).end();
      }
      //promise the creation of a user
      return {
        name: payload['name'], //profile name
        pic: payload['picture'], //profile pic
        id: payload['sub'], //google id
        email_verified: payload['email_verified'], 
        email: payload['email']
      }
  } ).then( user => { return user; } )
  .catch( err => {
  //throw an error if something gos wrong
    console.log(err);
    return res.status(200).json({message: "Internal Server Error"}).end();
  } )

}
