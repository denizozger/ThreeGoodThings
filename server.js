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
  http = require('http'),
  async = require('async');

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

app.listen(3000, function(){
  console.log("ready captain.");
});

/**
 * Public API
 */

app.get('/api/threethings/edit', function(req, res) {
  res.json({data: '', user: req.user});
});

app.post('/api/threethings/edit', [authed, express.json()], function(req, res) {

  var now = new Date();

  var things = {
    first : req.body.firstthing,
    second : req.body.secondthing,
    third : req.body.thirdthing,
    addedBy : {
      name : req.user.identifier.name.givenName,
      surname : req.user.identifier.name.familyName
    },
    addedDate : {
      day : now.getDate(),
      month : now.getMonth(),
      year : now.getFullYear()
    }
  };

  var userId = encodeURIComponent(req.user.identifier.identifier);

  var thingsURL = config.thingsdb + '1-' +
    // today.getDate() + today.getMonth() + today.getFullYear();
    getRandomInt(1, 1000);

  log.info('Adding record to DB. URL: ' + thingsURL + ' , values: ' +
    things.first + ' ' + things.second + ' '  + things.third);

  request({
    method: 'PUT',
    url: thingsURL,
    json: things
  }, function(err, res, body) {
    if (err) {
      log.error(err);
    }
    log.verbose(res.statusCode, things);
  });

  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end();
});

app.get('/api/threethings/list', function(req, res) {

  function getAllThings(callback) {
    request({
      method: 'GET',
      url: 'http://localhost:5984/things/_all_docs'
    }, function(err, res, body) {
      callback(JSON.parse(body));
    });
  }

  function handleAllThings(allThings) {

    var allThingsData = [];
    var completedCalls = 0;

    async.each(allThings.rows, function(thing, callback) {
      log.silly('Getting thing ' + thing.id);

      function addThingData(thingData) {
        completedCalls++;
        allThingsData.push(thingData);

        if (completedCalls === allThings.rows.length) {
          log.info('Retrieved ' + allThingsData.length + ' records');

          allThingsData = sortByDate(allThingsData);

          console.log(allThingsData)

          res.json({data: allThingsData, user: req.user});
        }
      }

      request({
        method: 'GET',
        url: 'http://localhost:5984/things/' + thing.id
      }, function(err, res, body) {
        log.silly('Retrieved from DB: ' + JSON.parse(body).id);
        addThingData(JSON.parse(body));
      });

      callback();
    }, function(err){
      if (err) {
        log.error('Error: ' + err)
      }
    });

  }

  getAllThings(function(things){
    handleAllThings(things);
  });
});

app.get('/api/home', function(req, res){
  res.json({data: '', user: req.user});
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

app.get('/api/session', function(req, res) {
    if (req.session) {
        res.json(req.session);
    } else {
        res.send('You have no session.');
    }
});

function sortByDate(array) {
  array.sort(function(o1, o2) {
    var o1date = new Date(o1.addedDate.year + '-' + o1.addedDate.month + '-' + o1.addedDate.day);
    var o2date = new Date(o2.addedDate.year + '-' + o2.addedDate.month + '-' + o2.addedDate.day);

    return new Date(o2date) - new Date(o1date);
  });

  return array;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
