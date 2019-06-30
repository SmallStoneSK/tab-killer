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
      const {domains} = tabsData[i];
      for(let j = 0, l = domains.length; j < l; j++) {
        const filtered = domains[j].tabs.filter(tab => {
          if(Array.isArray(data)) {
            return data.findIndex(item => tab.id === item.id) === -1;
          } else {
            return tab.id !== data.id;
          }
        });
        if(filtered.length < domains[j].tabs.length) {

          // 构造新的domain分组
          const newDomain = {...domains[j], tabs: filtered};
          const newDomains = domains.slice(0);
          if(newDomain.tabs.length > 0) {
            newDomains[j] = newDomain;
          } else {
            newDomains.splice(j, 1);
          }

          // 构造新的窗口分组
          const newData = {...tabsData[i], domains: newDomains};
          const newTabsData = tabsData.slice(0);
          newTabsData[i] = newData;
          this.setState({tabsData: newTabsData});
          return;
        }
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
      setTimeout(resolve, timeout);
    });
  },
  extractDomain(url) {
    if(typeof url !== 'string') {
      return 'UnKnown';
    }
    const ret = url.match(/(https?:\/\/[^/]+)/);
    return ret ? ret[1] : 'UnKnown';
  },
  convertTabsData(allTabs = [], currentTab = {}) {

    // 过滤非法数据
    if(!(allTabs.length > 0 && currentTab.windowId !== undefined)) {
      return [];
    }

    // 分组归类
    const hash = Object.create(null);
    for(const tab of allTabs) {

      // 按windowId第一层分组
      if(!hash[tab.windowId]) {
        hash[tab.windowId] = {};
      }

      // 按域名第二层分组
      const domain = Helper.extractDomain(tab.url);
      if(!hash[tab.windowId][domain]) {
        hash[tab.windowId][domain] = [];
      }

      hash[tab.windowId][domain].push(tab);
    }

    // 将hash从对象转成数组
    const data = [];
    const curDomain = Helper.extractDomain(currentTab.url);
    Object.keys(hash).forEach(windowId => {
      const domains =[];
      Object.keys(hash[windowId]).forEach(domain => {
        domains.push({
          domain,
          tabs: hash[windowId][domain],
          isCurDomain: domain === curDomain
        });
      });
      data.push({
        domains,
        windowId: Number(windowId),
        isCurWindow: Number(windowId) === currentTab.windowId,
        tabsCount: domains.reduce((cnt, cur) => cnt + cur.tabs.length, 0)
      });
    });

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
