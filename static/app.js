var ThingsEditView = Backbone.View.extend({
    el: '.page',
    events: {
        'submit .edit-things-form': 'saveThings'
    },
    saveThings: function (ev) {
    	console.log('save');
    }
});

var thingsEditView = new ThingsEditView();

/**
 * Router
 */

var Router = Backbone.Router.extend({
    routes: {
        "things/new": "editThings"
    }
});

var router = new Router;

Backbone.history.start();