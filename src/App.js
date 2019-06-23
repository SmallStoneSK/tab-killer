import React from 'react';

import {STATUS} from './Constans';
import {TabsList} from './TabsList';

export default class App extends React.PureComponent {

  state = {
    tabsData: [],
    status: STATUS.LOADING
  }

  componentDidMount() {
    this.getTabsData();
  }

  getTabsData() {
    Promise.all([
      this.getAllTabs(),
      this.getCurrentTab(),
      Helper.waitFor(300),
    ]).then(([allTabs, currentTab]) => {
      this.allTabs = allTabs;
      this.currentTab = currentTab;
      const tabsData = Helper.convertTabsData(allTabs, currentTab);
      if(tabsData.length > 0) {
        this.setState({tabsData, status: STATUS.OK});
      } else {
        this.setState({tabsData: [], status: STATUS.EXCEPTION});
      }
    }).catch(err => {
      this.setState({tabsData: [], status: STATUS.EXCEPTION});
      console.log('get tabs data failed, the error is:', err.message);
    });
  }

  getAllTabs() {
    return new Promise(resolve => {
      chrome.tabs.query({}, tabs => resolve(tabs));
    });
  }

  getCurrentTab() {
    return new Promise(resolve => {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, tabs => resolve(tabs[0]));
    });
  }

  onRemoveTab = data => {
    const {tabsData} = this.state;
    for(let i = 0, len = tabsData.length; i < len; i++) {
      const {tabs} = tabsData[i];
      const filtered = tabs.filter(tab => tab !== data);
      if(filtered.length < tabs.length) {
        const newData = {...tabsData[i], tabs: filtered};
        const newTabsData = tabsData.slice(0);
        newTabsData[i] = newData;
        this.setState({tabsData: newTabsData});
        break;
      }
    }
  }

  onFilterTab = key => {
    const filteredTabs = this.allTabs.filter(tab => (
      tab.title.indexOf(key) > -1 || tab.url.indexOf(key) > -1
    ));
    const tabsData = Helper.convertTabsData(filteredTabs, this.currentTab);
      if(tabsData.length > 0) {
        this.setState({tabsData, status: STATUS.OK});
      } else {
        this.setState({tabsData: [], status: STATUS.EXCEPTION});
      }
  }

  render() {
    const {status, tabsData} = this.state;
    return (
      <div className="app-container">
        <TabsList
          data={tabsData}
          status={status}
          onRemove={this.onRemoveTab}
          onSearch={this.onFilterTab}
        />
      </div>
    );
  }
}

const Helper = {
  waitFor(timeout) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, timeout);
    });
  },
  convertTabsData(allTabs = [], currentTab = {}) {

    // 过滤非法数据
    if(!(allTabs.length > 0 && currentTab.windowId !== undefined)) {
      return [];
    }

    // 按windowId进行分组归类
    const hash = Object.create(null);
    for(const tab of allTabs) {
      if(!hash[tab.windowId]) {
        hash[tab.windowId] = [];
      }
      hash[tab.windowId].push(tab);
    }

    // 将obj转成array
    const data = [];
    Object.keys(hash).forEach(key => data.push({
      tabs: hash[key],
      windowId: Number(key),
      isCurWindow: Number(key) === currentTab.windowId
    }));

    // 进行排序，将当前窗口的顺序往上提，保证更好的体验
    data.sort((winA, winB) => {
      if(winA.isCurWindow) {
        return -1;
      } else if(winB.isCurWindow) {
        return 1;
      } else {
        return 0;
      }
    });

    return data;
  }
};
