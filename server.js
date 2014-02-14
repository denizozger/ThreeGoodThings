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
  log = require('npmlog'),
  http = require('http');

log.level = process.env.LOGGING_LEVEL || 'silly';

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
    log.silly('Allowed: user is authenticated');
    return next();
  } else if (redisClient.ready) {
    log.warn('Forbidden: user is not authenticated');
    res.json(403, {
      error: "forbidden",
      reason: "not_authenticated"
    });
  } else {
    log.error('Error: service unavailable');
    res.json(503, {
      error: "service_unavailable",
      reason: "authentication_unavailable"
    });
  }
};

app.listen(3000, function(){
  console.log("Server listening on http://localhost:3000/");
});

/**
 * Public API
 */

app.post('/api/threethings', [authed, express.json()], function(req, res) {

  var things = {
    first : req.body.firstthing,
    second : req.body.secondthing,
    third : req.body.thirdthing
  };

  var userId = encodeURIComponent(req.user.identifier);
  var today = new Date();

  var thingsURL = config.thingsdb + '1/' + 
    today.getDate() + today.getMonth() + today.getFullYear();
  
  // console.log(thingsURL);
  // console.log(things);

  request({
    method: 'PUT',
    url: thingsURL,
    json: things
  }, function(err, res, body) {
    if (err) {
      //throw Error(err);
      log.error(err);
    }
    //log.verbose(res.statusCode, things);
  });

  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end();
});

app.get('/api/threethings', authed, function(req, res){

  function getThings(callback) {
    request({
      method: 'GET',
      url: 'http://localhost:5984/things/1/2302014'
    }, function(err, res, body) {
      callback(JSON.parse(body));
    });
  }

  function handleThings(things){
    res.json([things]);
  }

  getThings(function(things){
    handleThings(things);        
  });
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
  log.silly('Logging out');
  req.logout();
  res.redirect('/');
});