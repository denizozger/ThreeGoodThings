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

