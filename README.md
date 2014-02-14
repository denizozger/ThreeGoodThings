# ThreeGoodThings


A (soon to be) application that people can share three good things happened on every day that they feel greateful for, because it will make them happy. Inspired by [Action for happiness](http://www.actionforhappiness.org/take-action/find-three-good-things-each-day).

# Requirements

- [CouchDB](http://couchdb.apache.org/) as the main database
- [Redis](http://redis.io/) for sessions
- [Bower](https://github.com/bower/bower) for managing front-end packages

# Installation

``` bash
npm install
bower install
curl -X PUT http://localhost:5984/things/
```

# Running

```bash
couchdb
redis-server
node --harmony server.js
```

Go to [http://localhost:3000/](http://localhost:3000/)

# Contribution

This is a project that I work on in my spare time, which is little. If you are inspired, drop me an email and/or create a pull request.


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/denizozger/threegoodthings/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

