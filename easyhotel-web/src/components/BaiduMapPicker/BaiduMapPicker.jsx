import React, { useEffect, useState } from 'react';
import { Button, Input, Space } from 'antd';
import { useBaiduMap } from '../../hooks/useBaiduMap';

/**
 * 百度地图选点组件
 * @param {Object} props - 组件属性
 * @param {Object} props.value - 当前坐标 {lng, lat}
 * @param {Function} props.onChange - 坐标变化回调
 * @param {number} props.height - 地图容器高度
 * @param {boolean} props.showSearch - 是否显示搜索框
 * @param {boolean} props.autoInit - 是否自动初始化地图
 */
const BaiduMapPicker = ({
  value = { lng: null, lat: null },
  onChange,
  height = 260,
  showSearch = true,
  autoInit = true,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');

  const {
    mapContainerRef,
    mapReady,
    mapError,
    searching,
    initMap,
    setMapPoint,
    searchLocation,
  } = useBaiduMap({
    onPointChange: (point) => {
      onChange?.(point);
    },
  });

  useEffect(() => {
    if (autoInit) {
      setTimeout(initMap, 0);
    }
  }, [autoInit]);

  useEffect(() => {
    if (mapReady && value?.lng && value?.lat) {
      setMapPoint(value.lng, value.lat);
    }
  }, [mapReady, value?.lng, value?.lat]);

  const handleSearch = () => {
    searchLocation(searchKeyword);
  };

  return (
    <div>
      {showSearch && (
        <Space style={{ marginBottom: 8 }} wrap>
          <Input
            style={{ width: 320 }}
            placeholder="关键词（如名称/地址）搜索定位"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
          <Button type="primary" onClick={handleSearch} loading={searching}>
            搜索
          </Button>
        </Space>
      )}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height,
          border: '1px solid #f0f0f0',
          borderRadius: 6,
          background: '#f7f7f7',
        }}
      />
      {mapError && (
        <div style={{ marginTop: 8, color: '#ff4d4f', fontSize: 12 }}>
          {mapError}
        </div>
      )}
      <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
        点击地图或搜索定位可选择坐标点
      </div>
    </div>
  );
};

export default BaiduMapPicker;
