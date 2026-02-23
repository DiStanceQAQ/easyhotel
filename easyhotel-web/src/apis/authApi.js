import request from '../utils/request';

// 注册
export const register = (data) => {
    return request.post('/auth/register', data);
};

// 登录
export const login = (data) => {
    return request.post('/auth/login', data);
};

// 获取当前用户信息
export const getCurrentUser = () => {
    return request.get('/auth/me');
};

// 完善/修改商户资料
export const updateMerchantProfile = (data) => {
    return request.post('/merchant/profile', data);
};