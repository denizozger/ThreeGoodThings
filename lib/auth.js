'use strict';

const request = require('request'),
  async = require('async'),
  log = require('npmlog');

module.exports = function(authed, passport, app) {

  app.get('/api/user', authed, function(req, res){
    res.json(req.user);
  });

  app.get('/auth/google/:return?',
    passport.authenticate('google', { successRedirect: '/' })
  );

  app.get('/auth/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  app.get('/api/session', function(req, res) {
      if (req.session) {
          res.json(req.session);
      } else {
          res.send('You have no session.');
      }
  });

}