import request from '../utils/request';

// 获取所有标签列表
export const getTags = () => {
    return request.get('/common/tags');
};

// 通用文件上传
export const uploadFile = (formData) => {
    return request.post('/common/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

