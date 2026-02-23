import request from '../utils/request';

// ==================== 酒店审核 ====================

// 获取酒店审核列表
export const getAuditList = (params) => {
    return request.get('/admin/hotels/audit', { params });
};

// 获取酒店审核详情
export const getAuditDetail = (id) => {
    return request.get(`/admin/hotels/${id}/audit-detail`);
};

// 提交审核结果
export const submitAudit = (id, data) => {
    return request.post(`/admin/hotels/${id}/audit`, data);
};

// ==================== 发布管理 ====================

// 获取酒店发布列表
export const getPublishList = (params) => {
    return request.get('/admin/hotels/publish', { params });
};

// 获取发布详情
export const getPublishDetail = (id) => {
    return request.get(`/admin/hotels/publish/${id}`);
};

// 修改酒店发布状态
export const updatePublishStatus = (id, data) => {
    return request.patch(`/admin/hotels/${id}/publish`, data);
};

// ==================== Banner管理 ====================

// 获取Banner候选酒店列表
export const getCandidateHotels = (params) => {
    return request.get('/admin/banners/candidate-hotels', { params });
};

// 获取Banner列表
export const getBanners = (params) => {
    return request.get('/admin/banners', { params });
};

// 创建Banner
export const createBanner = (data) => {
    return request.post('/admin/banners', data);
};

// 更新Banner
export const updateBanner = (id, data) => {
    return request.put(`/admin/banners/${id}`, data);
};

// 删除Banner
export const deleteBanner = (id) => {
    return request.delete(`/admin/banners/${id}`);
};

// ==================== 标签管理 ====================

// 创建标签
export const createTag = (data) => {
    return request.post('/admin/tags', data);
};

// 删除标签
export const deleteTag = (id) => {
    return request.delete(`/admin/tags/${id}`);
};