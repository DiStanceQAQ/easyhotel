import request from '../utils/request';

// ==================== 酒店管理 ====================

// 获取我的酒店列表
export const getMyHotels = (params) => {
    return request.get('/merchant/hotels', { params });
};

// 创建酒店（草稿）
export const createHotel = (data) => {
    return request.post('/merchant/hotels', data);
};

// 获取酒店详情（编辑回显）
export const getHotelDetail = (id) => {
    return request.get(`/merchant/hotels/${id}`);
};

// 更新酒店信息（保存草稿）
export const updateHotel = (id, data) => {
    return request.put(`/merchant/hotels/${id}`, data);
};

// 管理酒店图片（批量保存）
export const updateHotelImages = (id, data) => {
    return request.post(`/merchant/hotels/${id}/images`, data);
};

// 提交酒店审核
export const submitHotelAudit = (id) => {
    return request.post(`/merchant/hotels/${id}/submit`);
};

// ==================== 房型管理 ====================

// 获取某酒店的房型列表
export const getHotelRooms = (hotelId) => {
    return request.get(`/merchant/hotels/${hotelId}/rooms`);
};

// 获取房型详情
export const getRoomDetail = (id) => {
    return request.get(`/merchant/rooms/${id}`);
};

// 创建房型
export const createRoom = (data) => {
    return request.post('/merchant/rooms', data);
};

// 更新房型
export const updateRoom = (id, data) => {
    return request.put(`/merchant/rooms/${id}`, data);
};

// 修改房型售卖状态
export const updateRoomStatus = (id, data) => {
    return request.patch(`/merchant/rooms/${id}/status`, data);
};