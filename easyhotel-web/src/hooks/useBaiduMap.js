import { useRef, useState } from 'react';
import { message } from 'antd';

/**
 * 百度地图自定义Hook
 * @param {Object} options - 配置选项
 * @param {Function} options.onPointChange - 点击地图时的回调
 * @returns {Object} 地图相关的状态和方法
 */
export const useBaiduMap = ({ onPointChange } = {}) => {
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [searching, setSearching] = useState(false);
  const [currentPoint, setCurrentPoint] = useState({ lng: null, lat: null });
  
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const localSearchRef = useRef(null);
  const mapRetryRef = useRef(0);

  /**
   * 初始化地图
   */
  const initMap = () => {
    if (mapRef.current) return;
    
    if (!mapContainerRef.current || !window.BMap) {
      mapRetryRef.current += 1;
      if (mapRetryRef.current <= 20) {
        setTimeout(initMap, 500);
        return;
      }
      // setMapError('百度地图加载失败，请检查AK配置或白名单');
      // message.error('百度地图加载失败，请检查AK配置或白名单');
      return;
    }

    try {
      setMapError('');
      const map = new window.BMap.Map(mapContainerRef.current);
      const defaultPoint = new window.BMap.Point(116.404, 39.915);
      map.centerAndZoom(defaultPoint, 12);
      map.enableScrollWheelZoom(true);

      // 添加点击事件
      map.addEventListener('click', (event) => {
        const { lng, lat } = event.point;
        setMapPoint(lng, lat);
        onPointChange?.({ lng, lat });
      });

      mapRef.current = map;

      // 延迟调整地图大小
      setTimeout(() => {
        if (mapRef.current?.checkResize) {
          mapRef.current.checkResize();
        }
      }, 300);

      // 初始化本地搜索
      localSearchRef.current = new window.BMap.LocalSearch(map, {
        onSearchComplete: (results) => {
          setSearching(false);
          if (!results || results.getCurrentNumPois() === 0) {
            message.warning('未找到相关地点');
            return;
          }
          const poi = results.getPoi(0);
          if (poi?.point) {
            setMapPoint(poi.point.lng, poi.point.lat);
            map.centerAndZoom(poi.point, 15);
            onPointChange?.({ lng: poi.point.lng, lat: poi.point.lat });
          }
        },
      });

      setMapReady(true);
    } catch (error) {
      // setMapError('百度地图初始化失败，请检查AK配置或白名单');
      // message.error('百度地图初始化失败，请检查AK配置或白名单');
    }
  };

  /**
   * 设置地图点位并添加标记
   * @param {number} lng - 经度
   * @param {number} lat - 纬度
   */
  const setMapPoint = (lng, lat) => {
    if (!lng || !lat) return;
    
    setCurrentPoint({ lng, lat });
    
    if (!mapRef.current || !window.BMap) return;
    
    const point = new window.BMap.Point(lng, lat);
    mapRef.current.clearOverlays();
    mapRef.current.addOverlay(new window.BMap.Marker(point));
    mapRef.current.panTo(point);
  };

  /**
   * 搜索地点
   * @param {string} keyword - 搜索关键词
   */
  const searchLocation = (keyword) => {
    if (!keyword?.trim()) {
      message.warning('请输入关键词进行定位');
      return;
    }
    
    if (!localSearchRef.current) {
      message.error('地图尚未初始化');
      return;
    }
    
    setSearching(true);
    localSearchRef.current.search(keyword.trim());
  };

  /**
   * 清空地图标记
   */
  const clearMarkers = () => {
    if (mapRef.current) {
      mapRef.current.clearOverlays();
    }
  };

  return {
    mapContainerRef,
    mapRef,
    mapReady,
    mapError,
    searching,
    currentPoint,
    initMap,
    setMapPoint,
    searchLocation,
    clearMarkers,
  };
};
