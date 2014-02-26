/**
 * Home
 */

var Home = Backbone.Model.extend({
  urlRoot: '/api/home'
})

var HomeView = Backbone.View.extend({
  el: '#login-logout-section',
  render: function() {
    var that = this;
    var home = new Home();

    home.fetch({
        success: function (home) {
          var loggedInUser = home.attributes.user;

          var template = _.template($('#login-logout-button').html(), {loggedInUser: loggedInUser});
          that.$el.html(template);

          if (loggedInUser) {
            thingsEditView.render();
          } 
        }
    })
  }
});

var homeView = new HomeView();

/**
 * Three Things Edit
 */

var ThreeThings = Backbone.Model.extend({
  urlRoot: '/api/threethings'
});

var ThingsEditView = Backbone.View.extend({
  el: '.things-edit',
  events: {
    'submit .edit-things-form': 'saveThings'
  },
  render: function() {
    var that = this;
    var template = _.template($('#edit-things-form').html(), {});
    that.$el.html(template);
  },
  saveThings: function (ev) {
    var threeThingsDetails = $(ev.currentTarget).serializeObject();
    var threethings = new ThreeThings();
    
    threethings.save(threeThingsDetails, {
      success: function () {
        router.navigate('things', {trigger:true});
      }
    });

    router.navigate('things', {trigger:true});

    return false;
  }
});

var thingsEditView = new ThingsEditView();

/**
 * Three Things List
 */

var ThingsListView = Backbone.View.extend({
    el: '.things-list',
    render: function () {
        var that = this;
        var threeThings = new ThreeThings();
        threeThings.fetch({
            success: function (things) {
              console.log('fetched')
              var template = _.template($('#things-list-template').html(), {things: things.attributes});
              that.$el.html(template);
            }
        })
    }
});

var thingsListView = new ThingsListView();

/**
 * Routing
 */

var Router = Backbone.Router.extend({
  routes: {
    '': 'home',
    'things': 'things',
  }
});

var router = new Router;

router.on('route:home', function() {
  homeView.render();

  thingsListView.render();
});

router.on('route:things', function() {
  thingsListView.render();
})

Backbone.history.start();

$.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};
