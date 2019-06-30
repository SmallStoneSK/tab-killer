import React from 'react';

import {
  Row,
  Icon,
  Spin,
  List,
  Empty,
  Input,
  Avatar,
  Button,
  Collapse,
  Typography
} from 'antd';

import {STATUS} from './Constans';

const DEFAULT_OPEN = new Array(100).fill(null).map((_, idx) => idx.toString());

export class TabsList extends React.PureComponent {

  static defaultProps = {
    data: [],
    onRemove: () => {},
    onSearch: () => {}
  };

  onSearchValueChange = evt => {
    const value = evt.target.value;
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.props.onSearch(value);
    }, 500);
  }

  renderLoading() {
    return (
      <div className={'loading-container'}>
        <Spin size="large"/>
      </div>
    );
  }

  renderOK() {
    const {data, onRemove} = this.props;
    return (
      <React.Fragment>
        <div className={'search-box'}>
          <Input
            placeholder={'搜索'}
            prefix={<Icon type={'search'} style={{color: 'rgba(0,0,0,.25)'}} />}
            onChange={this.onSearchValueChange}
          />
        </div>
        <Collapse
          expandIconPosition={'right'}
          defaultActiveKey={DEFAULT_OPEN}
        >
          {data.map((item, index) => {
            const dotColor = item.isCurWindow ? 'green' : 'gray';
            const title = item.isCurWindow ? '当前窗口' : `窗口${index}`;
            return (
              <Collapse.Panel
                key={index}
                header={(
                  <Row className={'window-header-container'}>
                    <span className={`window-header-status-dot ${dotColor}`}/>
                    <Typography.Text strong>{title}</Typography.Text>
                    <Typography.Text type={'secondary'} className={'window-header-subTitle-text'}>
                      （{item.tabsCount}tabs）
                    </Typography.Text>
                  </Row>
                )}
              >
                <WindowItem
                  domains={item.domains}
                  isCurWindow={index === 0}
                  onRemove={onRemove}
                />
              </Collapse.Panel>
            );
          })}
        </Collapse>
      </React.Fragment>
    );
  }

  renderException() {
    return (
      <React.Fragment>
        <div className={'search-box'}>
          <Input
            placeholder={'搜索'}
            prefix={<Icon type={'search'} style={{color: 'rgba(0,0,0,.25)'}} />}
            onChange={this.onSearchValueChange}
          />
        </div>
        <div className={'no-result-container'}>
          <Empty description={'没有数据哎~'}/>
        </div>
      </React.Fragment>
    );
  }

  render() {
    const {status} = this.props;
    switch(status) {
      case STATUS.LOADING:
        return this.renderLoading();
      case STATUS.OK:
        return this.renderOK();
      case STATUS.EXCEPTION:
      default:
        return this.renderException();
    }
  }
}

class WindowItem extends React.PureComponent {

  renderItem = item => {
    const {isCurWindow, onRemove} = this.props;
    return (
      <DomainItem
        {...item}
        isCurWindow={isCurWindow}
        onRemove={onRemove}
      />
    );
  }

  render() {
    const {domains} = this.props;
    return (
      <List
        size={'small'}
        dataSource={domains}
        className={'window-item-container'}
        renderItem={this.renderItem}
      />
    );
  }
}

class DomainItem extends React.PureComponent {

  onClick = item => {
    chrome.windows.update(item.windowId, {focused: true});
    chrome.tabs.highlight({tabs: item.index, windowId: item.windowId});
  }

  onClickRemove = (evt, item) => {
    evt.stopPropagation();
    const id = Array.isArray(item) ? item.map(_ => _.id) : item.id;
    chrome.tabs.remove(id);
    this.props.onRemove(item);
  }

  renderSingleTab(item, index) {
    const {isCurWindow} = this.props;
    const isSelected = item.highlighted && isCurWindow;
    return (
      <List.Item
        key={index}
        className={`domain-item-container ${isSelected ? 'selected' : ''}`}
        onClick={() => this.onClick(item)}
      >
        <Avatar
          size={16}
          shape={'shape'}
          src={item.favIconUrl}
        />
        <Typography.Text
          ellipsis
          strong={isSelected}
          className={'domain-item-title-text'}
        >
          {item.title}
        </Typography.Text>
        <Button
          type={'primary'}
          className={'close-btn'}
          onClick={evt => this.onClickRemove(evt, item)}
        >
          <Icon type={'close'} className={'close-icon'}/>
        </Button>
      </List.Item>
    );
  }

  renderMultipleTabs() {
    const {tabs, domain, isCurWindow, isCurDomain} = this.props;
    const isSelected = isCurWindow && isCurDomain;
    return (
      <Collapse
        expandIconPosition={'left'}
        className={'multiple-domain-item'}
        defaultActiveKey={isSelected ? ['0'] : undefined}
        expandIcon={({isActive}) => <Icon type="caret-right" rotate={isActive ? 90 : 0} />}
      >
        <Collapse.Panel
          header={(
            <Row className={'window-header-container'}>
              <span className={'domain-header-title-text'}>{domain}</span>
              <Button
                type={'primary'}
                className={'close-btn'}
                onClick={evt => this.onClickRemove(evt, tabs)}
              >
                <Icon type={'close'} className={'close-icon'}/>
              </Button>
            </Row>
          )}
        >
          <div className={'window-item-container'}>
            {tabs.map((item, index) => this.renderSingleTab(item, index))}
          </div>
        </Collapse.Panel>
      </Collapse>
    );
  }

  render() {
    const {tabs} = this.props;
    if(tabs.length > 1) {
      return this.renderMultipleTabs();
    } else {
      return this.renderSingleTab(tabs[0]);
    }
  }
}
