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
        console.log('saved');
        router.navigate('things', {trigger:true});
      }
    });

    router.navigate('things', {trigger:true});

    return false;
  }
});

var thingsEditView = new ThingsEditView();

var ThingsListView = Backbone.View.extend({
    el: '.page',
    render: function () {
      console.log('render')
        var that = this;
        var threeThings = new ThreeThings();
        threeThings.fetch({
            success: function (things) {
              console.log(things.attributes)
                var template = _.template($('#things-list-template').html(), {things: things.attributes});
                that.$el.html(template);
            }
        })
    }
});

var thingsListView = new ThingsListView();


var Router = Backbone.Router.extend({
  routes: {
    '': 'home',
    "things": "things",
  }
});

var router = new Router;

router.on('route:home', function() {
  thingsEditView.render();
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
