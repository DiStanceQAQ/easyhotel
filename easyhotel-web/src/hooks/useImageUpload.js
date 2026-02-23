import { useState } from 'react';
import { message } from 'antd';
import { uploadFile } from '../apis/commonApi';

/**
 * 图片上传自定义Hook
 * @returns {Object} 上传相关的状态和方法
 */
export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  /**
   * 处理图片上传
   * @param {Object} options - 上传选项
   * @param {File} options.file - 要上传的文件
   * @param {Function} options.onSuccess - 成功回调
   * @param {Function} options.onError - 失败回调
   * @returns {Promise<string|null>} 返回上传后的URL或null
   */
  const handleUpload = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await uploadFile(formData);
      const url = response.data?.data?.url;
      
      if (!url) {
        throw new Error('上传失败：未返回文件URL');
      }
      
      message.success('图片上传成功');
      onSuccess?.();
      return url;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || '上传失败';
      message.error(errorMsg);
      onError?.(error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  /**
   * 处理简单的文件上传（用于beforeUpload）
   * @param {File} file - 要上传的文件
   * @returns {Promise<string|null>} 返回上传后的URL或null
   */
  const uploadSingleFile = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await uploadFile(formData);
      const url = response.data?.data?.url;
      
      if (!url) {
        throw new Error('上传失败：未返回文件URL');
      }
      
      message.success('图片上传成功');
      return url;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || '上传失败';
      message.error(errorMsg);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    handleUpload,
    uploadSingleFile,
  };
};
