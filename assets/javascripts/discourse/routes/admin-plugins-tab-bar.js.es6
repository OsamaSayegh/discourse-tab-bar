import { ajax } from 'discourse/lib/ajax';

export default Discourse.Route.extend({
  model() {
    return ajax({ url: '/tab-bar/get.json', method: 'GET' });
  },

  setupController(controller, model) { 
    controller.setProperties({ model, tabs: model.tabs });
    controller.set('model.save', function() {
      const tabs = controller.comparableAttrs(controller.get('tabs'));
      return ajax({ url: '/tab-bar/update', method: 'POST', data: { tabs: JSON.stringify(tabs) } });
    });
    controller.get('tabs').forEach(tab => {
      controller.observeTab(tab);
    });
  },

  deactivate() {
    this.controller.reset();
  }
});
