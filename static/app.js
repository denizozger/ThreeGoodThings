/**
 * Home
 */

var LoginLogoutModel = Backbone.Model.extend({
  urlRoot: '/api/home'
})

var LoginLogoutView = Backbone.View.extend({

  el: '#login-logout-section',

  initialize: function() {
    this.model = new LoginLogoutModel();
  },

  render: function() {
    var that = this;

    this.model.fetch({
        success: function (response) {
          var loggedInUser = response.attributes.user;

          var template = _.template($('#login-logout-button').html(), {loggedInUser: loggedInUser});
          that.$el.html(template);

          if (loggedInUser) {
            thingsEditView.render();
          }
        }
    });
  }
});

var loginLogoutView = new LoginLogoutView();

/**
 * Three Things Edit
 */

var ThreeThingsModel = Backbone.Model.extend({
  urlRoot: '/api/threethings/edit'
});

var ThingsEditView = Backbone.View.extend({
  el: '.things-edit',

  events: {
    'submit .edit-things-form': 'saveThings'
  },

  initialize: function(){
    this.model = new ThreeThingsModel();
  },

  render: function() {
    var that = this;

    this.model.fetch({
        success: function (response) {
          var template = _.template($('#edit-things-form').html(), {});
          that.$el.html(template);
        },
        error: function(){
          // user is not logged in
        }
    })
  },

  saveThings: function (ev) {
    ev.preventDefault();
    var that = this;

    var threeThingsDetails = $(ev.currentTarget).serializeObject();

    this.model.save(threeThingsDetails, {
      success: function (model, xhr, options) {
        console.log('Successfully saved things: ' + JSON.stringify(threeThingsDetails));

        that.trigger('saved');
      },
      error: function(model, xhr, options){
        // console.error(xhr);
        console.error(xhr);
        that.trigger('saved');
        // TODO actually BE saves properly, but backbone is in error state
      }
    });
  }
});

var thingsEditView = new ThingsEditView();

/**
 * Three Things List
 */

var ThreeThingsListModel = Backbone.Model.extend({
  urlRoot: '/api/threethings/list'
 });

var ThingsListView = Backbone.View.extend({

    el: '.things-list',

    initialize: function(){
      this.model = new ThreeThingsListModel();
    },

    render: function () {
        var that = this;

        this.model.fetch({
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
 * View communications
 */

thingsListView.listenTo(thingsEditView, 'saved', function (parameters) {
  thingsListView.render();
});

/**
 * Routing
 */

var Router = Backbone.Router.extend({
  routes: {
    '': 'home'
  }
});

var router = new Router;

router.on('route:home', function() {
  loginLogoutView.render();
  thingsEditView.render();
  thingsListView.render();
});

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
