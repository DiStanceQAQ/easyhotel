import axios from 'axios';
import { baseURL } from '../config/index.js';
import useAuthStore from '../stores/useAuthStore';

// 创建axios实例
const request = axios.create({
    baseURL: baseURL, // 基础URL
    timeout: 20000, // 请求超时时间
});

// 请求缓存配置
const CACHE_TIME = 5 * 60 * 1000; // 5分钟缓存
const requestCache = new Map();

// 生成缓存键
const getCacheKey = (config) => {
    const queryParams = new URLSearchParams(config.params || {}).toString();
    const method = config.method?.toLowerCase() || 'get';
    return `${method} ${config.url} ${queryParams}`;
};

// 清理过期缓存
const cleanExpiredCache = () => {
    const now = Date.now();
    for (const [key, value] of requestCache.entries()) {
        if (now - value.timestamp > CACHE_TIME) {
            requestCache.delete(key);
        }
    }
};

// 定期清理缓存（每分钟）
setInterval(cleanExpiredCache, 60000);

// 添加请求拦截器
request.interceptors.request.use(function (config) {
    // 从store获取token并注入到请求头
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    // GET请求且未禁用缓存时，检查缓存
    if (config.method?.toLowerCase() === 'get' && config.useCache !== false) {
        const cacheKey = getCacheKey(config);
        const cached = requestCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_TIME) {
            // 返回缓存的响应，不发送实际请求
            return Promise.reject({
                __cache: true,
                response: cached.response,
            });
        }
    }
    
    return config;
}, function (error) {
    // 处理请求错误
    return Promise.reject(error);
});

// 添加响应拦截器
request.interceptors.response.use(function (response) {
    // GET请求且未禁用缓存时，保存到缓存
    if (response.config.method?.toLowerCase() === 'get' && response.config.useCache !== false) {
        const cacheKey = getCacheKey(response.config);
        requestCache.set(cacheKey, {
            response: response,
            timestamp: Date.now(),
        });
    }
    return response;
}, function (error) {
    // 如果是缓存命中，返回缓存数据
    if (error.__cache) {
        return error.response;
    }
    // 对响应错误做点什么
    return Promise.reject(error);
});

export default request;