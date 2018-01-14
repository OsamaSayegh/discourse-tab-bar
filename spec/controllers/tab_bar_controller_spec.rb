require "rails_helper"

describe DiscourseTabBar::TabBarController do
  routes { DiscourseTabBar::Engine.routes }

  def seed_default
    default_tabs = DiscourseTabBar::default_tabs
    DiscourseTabBar::set!(default_tabs)
    default_tabs
  end

  def get_tabs
    PluginStore.get(DiscourseTabBar::PLUGIN_NAME, DiscourseTabBar::KEY_NAME)
  end

  before do
    SiteSetting.tab_bar_enabled = true
  end

  it "seeds default tabs on first run" do
    before = PluginStore.get(DiscourseTabBar::PLUGIN_NAME, DiscourseTabBar::KEY_NAME)
    expect(before).to be_nil

    get :get, format: :json

    expect(response).to be_success
    expect(response.body).to eq({ tabs: DiscourseTabBar::default_tabs }.to_json)
  end

  it "doesn't let non-admin users change settings" do
    default_tabs = seed_default
    log_in(:moderator)

    post :update, params: { tabs: [].to_json }, format: :json

    expect(response).not_to be_success
    expect(get_tabs["tabs"].to_json).to eq(default_tabs.to_json)
  end

  it "lets admin users change settings" do
    seed_default
    log_in(:admin)

    new_tabs = [
      DiscourseTabBar::tab_template("Test00", "test01", "test02", true),
      DiscourseTabBar::tab_template("Test10", "test11", "test12", false),
      DiscourseTabBar::tab_template("Test20", "test21", "test22", false)
    ]
    post :update, params: { tabs: new_tabs.to_json }, format: :json

    expect(response).to be_success
    expect(response.body).to eq({ tabs: new_tabs }.to_json)

    json = JSON.parse(response.body)
    expect(json["tabs"]).to eq(get_tabs["tabs"])
  end

  it "lets admins remove all tabs" do
    seed_default
    log_in(:admin)

    new_tabs = []
    post :update, params: { tabs: new_tabs.to_json }, format: :json

    expect(response).to be_success
    expect(response.body).to eq({ tabs: new_tabs }.to_json)

    json = JSON.parse(response.body)
    expect(json["tabs"]).to eq(get_tabs["tabs"])
    expect(get_tabs["user_deleted_all"]).to eq(true)
  end
end
