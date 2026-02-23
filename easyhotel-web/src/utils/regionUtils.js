/**
 * 地区处理工具函数
 * 用于省市区级联选择器的数据处理
 */

/**
 * 构建级联选择器选项
 * @param {Object} data - china-area-data 的数据对象
 * @returns {Array} 级联选择器选项数组
 */
export const buildCascaderOptions = (data) => {
  const provinces = data['86'] || {};
  return Object.keys(provinces).map((provinceCode) => {
    const cities = data[provinceCode] || {};
    return {
      value: provinceCode,
      label: provinces[provinceCode],
      children: Object.keys(cities).map((cityCode) => {
        const districts = data[cityCode] || {};
        return {
          value: cityCode,
          label: cities[cityCode],
          children: Object.keys(districts).map((districtCode) => ({
            value: districtCode,
            label: districts[districtCode],
          })),
        };
      }),
    };
  });
};

/**
 * 根据城市名称查找对应的地区代码
 * @param {Array} options - 级联选择器选项数组
 * @param {string} cityName - 城市名称
 * @returns {Array|null} 地区代码数组 [省code, 市code, 区code] 或 null
 */
export const findRegionCodesByCity = (options, cityName) => {
  if (!cityName) return null;
  
  for (const province of options) {
    // 直接匹配到市级
    const cityMatch = province.children?.find((city) => city.label === cityName);
    if (cityMatch) {
      return [province.value, cityMatch.value];
    }
    
    // 匹配到区级
    for (const city of province.children || []) {
      const districtMatch = city.children?.find((district) => district.label === cityName);
      if (districtMatch) {
        return [province.value, city.value, districtMatch.value];
      }
    }
  }
  
  return null;
};

/**
 * 根据地区代码获取对应的名称标签
 * @param {Array} options - 级联选择器选项数组
 * @param {Array} codes - 地区代码数组
 * @returns {Array} 地区名称数组
 */
export const getRegionLabels = (options, codes) => {
  if (!codes || !codes.length) return [];
  
  const labels = [];
  let currentOptions = options;
  
  codes.forEach((code) => {
    const found = currentOptions?.find((item) => item.value === code);
    if (found) {
      labels.push(found.label);
      currentOptions = found.children || [];
    }
  });
  
  return labels;
};
