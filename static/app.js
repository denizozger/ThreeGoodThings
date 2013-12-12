var ThreeThings = Backbone.Model.extend({
  urlRoot: '/api/threethings'
});

var ThingsEditView = Backbone.View.extend({
  el: '.page',
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

      }
    });

    return false;
  }
});

var thingsEditView = new ThingsEditView();



// var Router = Backbone.Router.extend({
  // routes: {
    // '': 'home'
  // }
// });

// var router = new Router;

// router.on('route:home', function() {
  thingsEditView.render();
// });

// Backbone.history.start();

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
