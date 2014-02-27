/**
 * Home
 */

var LoginLogout = Backbone.Model.extend({
  urlRoot: '/api/home'
})

var LoginLogoutView = Backbone.View.extend({
  el: '#login-logout-section',
  render: function() {
    var that = this;
    var loginLogout = new LoginLogout();

    loginLogout.fetch({
        success: function (response) {
          var loggedInUser = response.attributes.user;

          var template = _.template($('#login-logout-button').html(), {loggedInUser: loggedInUser});
          that.$el.html(template);

          if (loggedInUser) {
            thingsEditView.render();
          }
        }
    })
  }
});

var loginLogoutView = new LoginLogoutView();

/**
 * Three Things Edit
 */

var ThreeThingsEdit = Backbone.Model.extend({
  urlRoot: '/api/threethings/edit'
});

var ThingsEditView = Backbone.View.extend({
  el: '.things-edit',
  events: {
    'submit .edit-things-form': 'saveThings'
  },
  render: function() {
    var that = this;

    var threeThingsEdit = new ThreeThingsEdit();

    threeThingsEdit.fetch({
        success: function (response) {
          var loggedInUser = response.attributes.user;

          if (loggedInUser) {
            var template = _.template($('#edit-things-form').html(), {});
            that.$el.html(template);
          }
        }
    })
  },
  saveThings: function (ev) {
    var threeThingsDetails = $(ev.currentTarget).serializeObject();
    var threethingsEdit = new ThreeThingsEdit();

    threethingsEdit.save(threeThingsDetails, {
      success: function () {
        console.log('Successfully saved things: ' + JSON.stringify(threeThingsDetails));
        router.navigate('things', {trigger:true});
      }
    });

    router.navigate('things', {trigger:true});

    var thingsListView = new ThingsListView();
    thingsListView.render();

    return false;
  }
});

var thingsEditView = new ThingsEditView();

/**
 * Three Things List
 */

 var ThreeThingsList = Backbone.Model.extend({
   urlRoot: '/api/threethings/list'
 });

var ThingsListView = Backbone.View.extend({
    el: '.things-list',
    render: function () {
        var that = this;
        var threeThings = new ThreeThingsList();
        threeThings.fetch({
            success: function (things) {
              console.log('Fetched ' + things.attributes.data.length);
              var template = _.template($('#things-list-template').html(), {things: things.attributes.data});
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
  loginLogoutView.render();
  thingsEditView.render();
  thingsListView.render();
});

router.on('route:things', function() {
  console.log('Router: #things');
  loginLogoutView.render();
  thingsEditView.render();
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
