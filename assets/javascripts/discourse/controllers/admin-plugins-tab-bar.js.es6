import { popupAjaxError } from 'discourse/lib/ajax-error';

export default Ember.Controller.extend({
  enabledTabs: Ember.computed.filterBy('tabs', 'enabled', true),
  createTabDisabled: Ember.computed.gt('tabs.length', 50),
  saveDisabled: true,
  saved: false,

  tabsUpdated() {
    this.set('saveDisabled', 
      _.isEqual(this.comparableAttrs(this.get('tabs')), this.comparableAttrs(this.get('site.tab_bar')))
    );
    this.set('saved', false);
  },

  comparableAttrs(tabs) {
    return tabs.map(tab => {
      return { name: tab.name, icon: tab.icon, dest: tab.dest, enabled: tab.enabled };
    });
  },

  observeTab(tab) {
    const index = this.get('tabs').indexOf(tab);
    const keys = Object.keys(tab);
    keys.forEach(key => {
      this.addObserver(`tabs.${index}.${key}`, this, this.tabsUpdated);
    })
  },

  move(tab, amount) {
    const tabs = this.get('tabs');
    const prevIndex = tabs.indexOf(tab);
    const newIndex = prevIndex + amount;

    if (newIndex < 0 || newIndex >= tabs.length) {
      return;
    }

    const newTabs = [...tabs];
    tabs.forEach((t, i) => {
      switch (i) {
        case prevIndex: newTabs[i] = tabs[newIndex]; break;
        case newIndex: newTabs[i] = tab; break;
      }
    });
    this.set('tabs', newTabs);
  },

  reset() {
    this.setProperties({
      saveDisabled: true,
      saved: false
    });
  },

  actions: {
    save() {
      this.set('saveDisabled', true);
      this.set('saved', false);
      this.get('model').save().then(results => {
        this.set('saved', true);
        this.set('site.tab_bar', results.tabs);
      }).catch(popupAjaxError);
    },

    add() {
      const tabs = this.get('tabs');
      const newTab = { name: '', icon: '', dest: '', enabled: false };
      this.observeTab(newTab)
      this.set('tabs', [...tabs, newTab]);
    }
  }
})
