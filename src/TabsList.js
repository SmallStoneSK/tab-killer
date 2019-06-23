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
          defaultActiveKey={['0']}
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
                      （{item.tabs.length}tabs）
                    </Typography.Text>
                  </Row>
                )}
              >
                <WindowItem
                  tabs={item.tabs}
                  isCurrentWindow={index === 0}
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

  onClick = item => {
    chrome.windows.update(item.windowId, {focused: true});
    chrome.tabs.highlight({tabs: item.index, windowId: item.windowId});
  }

  onClickRemove = (evt, item) => {
    evt.stopPropagation();
    chrome.tabs.remove(item.id);
    this.props.onRemove(item);
  }

  renderItem = item => {
    const isSelected = item.highlighted && this.props.isCurrentWindow;
    return (
      <List.Item
        className={`tab-item-container ${isSelected ? 'selected' : ''}`}
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
          className={'tab-item-title-text'}
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

  render() {
    const {tabs} = this.props;
    return (
      <List
        size={'small'}
        dataSource={tabs}
        className={'window-item-container'}
        renderItem={this.renderItem}
      />
    );
  }
}
