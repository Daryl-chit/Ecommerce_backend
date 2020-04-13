const login = require('./login');
const logout = require('./logout');
const register = require('./register');
const adminLogin = require('./adminLogin');
const adminLogout = require('./adminLogout');

module.exports.login = login;
module.exports.register = register;
module.exports.logout = logout;
module.exports.adminLogin = adminLogin;
module.exports.adminLogout = adminLogout;