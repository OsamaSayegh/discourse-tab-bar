# name: discourse-tab-bar
# about: A plugin to add a tab bar to your Discourse forums
# version: 0.1
# authors: Osama Sayegh
# url: https://github.com/OsamaSayegh/discourse-tab-bar

enabled_site_setting :tab_bar_enabled

add_admin_route 'tab_bar.title', 'tab-bar'

register_asset "stylesheets/tab-bar.scss"
register_asset "stylesheets/tab-bar-controls.scss"

after_initialize do
  require_dependency 'admin_constraint'
  require_dependency 'application_controller'
  require_dependency 'site_serializer'

  module ::DiscourseTabBar
    PLUGIN_NAME ||= "discourse-tab-bar".freeze
    KEY_NAME ||= "tabs".freeze

    class Engine < ::Rails::Engine
      engine_name PLUGIN_NAME
      isolate_namespace DiscourseTabBar
    end

    def self.tab_template(name, icon, dest, enabled)
      name = name.to_s
      icon = icon.to_s
      dest = dest.to_s
      enabled = ["true", true].include?(enabled)
      is_url = dest.start_with?("/")
      { name: name, icon: icon, dest: dest, enabled: enabled, is_url: is_url }
    end

    def self.default_tabs
      [
        tab_template("Home",          "home",        "/",                      true  ),
        tab_template("Profile",       "user",        "userActivity",           true  ),
        tab_template("Messages",      "envelope",    "userPrivateMessages",    true  ),
        tab_template("Bookmarks",     "bookmark",    "userActivity.bookmarks", true  ),
        tab_template("Preferences",   "cog",         "preferences",            true  ),
        tab_template("Notifications", "comment",     "userNotifications",      false ),
        tab_template("About",         "info-circle", "/about",                 false ),
      ]
    end

    def self.enabled?
      SiteSetting.tab_bar_enabled
    end

    def self.get
      PluginStore.get(PLUGIN_NAME, KEY_NAME) || {}
    end

    def self.set!(tabs)
      tabs.map! do |tab|
        tab_template(tab[:name], tab[:icon], tab[:dest], tab[:enabled])
      end

      if tabs.length > 50
        raise Discourse::InvalidParameters.new(I18n.t("tab_bar.errors.exceeded_amount_allowed_tabs"))
      end

      obj = { tabs: tabs }
      obj[:user_deleted_all] = tabs.blank?
      PluginStore.set(PLUGIN_NAME, KEY_NAME, obj)
    end

    def self.get_all
      obj = get
      set!(default_tabs) if obj.blank? # seed default tabs on first run
      tabs = get[:tabs]
      tabs
    end
  end

  class ::Guardian
    def can_edit_tab_bar?
      ::DiscourseTabBar.enabled? && is_admin?
    end
  end

  SiteSerializer.class_eval do
    attributes :tab_bar
    def tab_bar
      DiscourseTabBar.get_all
    end

    def include_tab_bar?
      DiscourseTabBar.enabled? && !scope.user.blank?
    end
  end

  DiscourseTabBar::Engine.routes.draw do
    get '/get' => 'tab_bar#get'
    post '/update' => 'tab_bar#update', constraints: AdminConstraint.new
  end

  ::Discourse::Application.routes.append do
    mount DiscourseTabBar::Engine, at: "/tab-bar"
    get '/admin/plugins/tab-bar' => 'admin/plugins#index', constraints: AdminConstraint.new
  end

  class ::DiscourseTabBar::TabBarController < ::ApplicationController
    def get
      raise Discourse::NotFound unless ::DiscourseTabBar.enabled?
      render json: { tabs: DiscourseTabBar.get_all }
    end

    def update
      guardian.ensure_can_edit_tab_bar!
      params.require(:tabs)

      tabs = JSON.parse(params[:tabs])
      tabs.map! { |tab| tab.symbolize_keys }

      begin
        DiscourseTabBar.set!(tabs)
      rescue Discourse::InvalidParameters => error
        return render_json_error error.message
      end

      render json: { tabs: DiscourseTabBar.get_all }
    end
  end
end
