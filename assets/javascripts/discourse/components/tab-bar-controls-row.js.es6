export default Ember.Component.extend({
  tagName: 'tr',
  classNameBindings: ['tab.enabled::inactive'],

  move(amount) {
    const tabs = this.get('tabs');
    const tab = this.get('tab');
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

  actions: {
    moveUp() {
      this.move(-1);
    },
    moveDown() {
      this.move(1);
    },
    remove() {
      const tabs = this.get('tabs');
      this.set('tabs', tabs.filter((tab, index) => tabs.indexOf(this.get('tab')) !== index));
    },
    toggle(boolean) {
      this.set('tab.enabled', boolean);
    }
  }
});
