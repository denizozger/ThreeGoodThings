#!/usr/bin/env node --harmony
'use strict';
const
  express = require('express'),
  app = express(),
  redisClient = require('redis').createClient(),
  RedisStore = require('connect-redis')(express),
  passport = require('passport'),
  GoogleStrategy = require('passport-google').Strategy,
  request = require('request'),
  log = require('npmlog');

app.use(express.logger('dev')),
app.use(express.cookieParser());
app.use(express.session({
    secret: 'threegoodthings',
    store: new RedisStore({
    client: redisClient
  })
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname + '/static'));
app.use(express.static(__dirname + '/bower_components'));

redisClient
.on('ready', function() { log.info('REDIS', 'ready'); })
.on('error', function(err) { log.error('REDIS', err.message); });

const config = {
  thingsdb: 'http://localhost:5984/things/'
};

/**
 * User authentication
 */
passport.serializeUser(function(user, done) {
  done(null, user.identifier);
});

passport.deserializeUser(function(id, done) {
  done(null, { identifier: id });
});

passport.use(new GoogleStrategy({
    returnURL: 'http://localhost:3000/auth/google/return',
    realm: 'http://localhost:3000/'
  },
  function(identifier, profile, done) {
    profile.identifier = identifier;
    return done(null, profile);
  }
));

// Authentication middleware
const authed = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else if (redisClient.ready) {
    res.json(403, {
      error: "forbidden",
      reason: "not_authenticated"
    });
  } else {
    res.json(503, {
      error: "service_unavailable",
      reason: "authentication_unavailable"
    });
  }
};

app.listen(3000, function(){
  console.log("ready captain.");
});

/**
 * Public API
 */

app.post('/api/threethings', [authed, express.json()], function(req, res) {

  var things = {
    first : req.body.firstthing,
    second : req.body.firstthing,
    third : req.body.firstthing
  };

  var userId = encodeURIComponent(req.user.identifier);
  var today = new Date();

  var thingsURL = config.thingsdb + encodeURIComponent(req.user.identifier) + 
    today.getDate() + today.getMonth() + today.getFullYear();

  request({
    method: 'PUT',
    url: config.thingsdb + thingsURL,
    json: things
  }, function(err, res, body) {
    if (err) {
      throw Error(err);
    }
    log.verbose(res.statusCode, things);
  });

  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end();
});

/**
 * Security
 */

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