import { withPluginApi } from 'discourse/lib/plugin-api';

function initializeWithApi(api) {
  api.registerConnectorClass('above-footer', 'discourse-tab-bar', {
    shouldRender(args, component) {
      const tabs = Discourse.Site.currentProp('tab_bar');
      return !Ember.isEmpty(component.get('currentUser')) &&
             component.get('site.isMobileDevice') &&
             component.get('site.mobileView') &&
             tabs && tabs.length > 0;
    },
    setupComponent() {
      this.set('tabs', Discourse.Site.currentProp('tab_bar'));
    }
  });
}

export default {
  name: 'discourse-tab-bar',
  initialize() {
    withPluginApi('0.8.13', initializeWithApi);
  }
};
