#!/usr/bin/env node --harmony
'use strict';
const
  express = require('express'),
  app = express(),
  redisClient = require('redis').createClient(),
  RedisStore = require('connect-redis')(express),
  passport = require('passport'),
  GoogleStrategy = require('passport-google').Strategy,
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
  done(null, user);
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
    // todo? here we can save the user to DB
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

/**
 * Modules
 */
require('./lib/auth.js')(authed, passport, app);
require('./lib/thingsdb.js')(config, authed, app);

app.listen(3000, function(){
  console.log("ready captain.");
});

/**
 * Public API
 */

app.get('/api/threethings/edit', authed, function(req, res) {
  res.json({data: '', user: req.user});
});

app.get('/api/home', function(req, res){
  res.json({data: '', user: req.user});
});
