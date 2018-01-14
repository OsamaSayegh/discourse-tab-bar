import { on } from 'ember-addons/ember-computed-decorators';
import DiscourseURL from 'discourse/lib/url';

const container = Discourse.__container__;
const mainRouter = container.lookup('router:main');

export default Ember.Component.extend({
  classNames: ['discourse-tab-bar'],
  tabs: Ember.computed('site.tab_bar', function() {
    const tabs = this.get('site.tab_bar');
    if (!tabs) { return [] }
    return tabs.filter(tab => tab.enabled);
  }),

  width: Ember.computed('tabs', function() {
    const tabs = this.get('tabs');
    if (tabs) {
      const length = tabs.length;
      const percentage = length ? 100 / length : length;
      return Ember.String.htmlSafe(`width: ${percentage}%;`);
    }
  }),

  highlight(dest) {
    this.get('tabs').forEach(tab => {
      if (tab.dest === dest) {
        Ember.set(tab, 'status', 'active');
        return;
      }
      Ember.set(tab, 'status', '');
    })
  },

  @on("init")
  modfiyClasses() {
    const self = this;
    this.get('tabs').filter(tab => !tab.is_url).forEach(tab => {
      const route = container.lookup(`route:${tab.dest}`);
      if (!route) { return; }
      route.reopen({
        actions: {
          didTransition() {
            this._super(...arguments);
            const target = this.modelFor('user');
            if (target && target.get('username') === self.get('currentUser.username')) {
              self.highlight(tab.dest);
            }
          }
        }
      })
    })
  },

  @on("init")
  onPageChange() {
    const self = this;
    const appEvents = container.lookup('app-events:main');
    appEvents.on('page:changed', data => {
      const tab = this.get('tabs').find(tab => tab.dest === data.url && tab.is_url);
      if (tab) {
        this.highlight(tab.dest);
      }
    });
  },

  actions: {
    navigate(dest) {
      const tab = this.get('tabs').find(tab => tab.dest === dest);
      if (tab) {
        this.highlight(tab.dest);
        if (!this.get('disabled')) {
          if (tab.is_url) {
            DiscourseURL.routeTo(dest);
            return;
          }
          mainRouter.transitionTo(dest, this.get('currentUser.username'));
        }
      }
    }
  }
});
