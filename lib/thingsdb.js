'use strict';

const request = require('request'),
  express = require('express'),
  async = require('async'),
  log = require('npmlog');

module.exports = function(config, authed, app) {

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
            // console.log(allThingsData)

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

  app.post('/api/threethings/edit', [authed, express.json()], function(req, res) {
    var now = new Date();

    var things = {
      first : req.body.firstthing,
      second : req.body.secondthing,
      third : req.body.thirdthing,
      addedBy : {
        name : req.user.identifier.name.givenName,
        surname : req.user.identifier.name.familyName,
        email : req.user.identifier.emails[0].value,
        identifier : req.user.identifier.identifier
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

}