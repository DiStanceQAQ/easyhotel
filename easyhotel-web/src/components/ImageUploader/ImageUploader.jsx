import React, { useState } from 'react';
import { Upload } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { useImageUpload } from '../../hooks/useImageUpload';

/**
 * 图片上传组件
 * @param {Object} props - 组件属性
 * @param {Array} props.value - 图片列表
 * @param {Function} props.onChange - 图片列表变化回调
 * @param {string} props.listType - Upload组件的listType
 * @param {number} props.maxCount - 最大上传数量
 * @param {boolean} props.multiple - 是否支持多选
 * @param {boolean} props.showUploadList - 是否显示文件列表
 * @param {string} props.uploadText - 上传按钮文本
 */
const ImageUploader = ({
  value = [],
  onChange,
  listType = 'picture-card',
  maxCount,
  multiple = false,
  showUploadList = true,
  uploadText = '上传图片',
}) => {
  const { uploading, handleUpload: customHandleUpload } = useImageUpload();
  const [fileList, setFileList] = useState(value);

  const handleUpload = async ({ file, onSuccess, onError }) => {
    const url = await customHandleUpload({ file, onSuccess, onError });
    if (url) {
      const newFile = {
        uid: `${Date.now()}-${file.name}`,
        name: file.name,
        status: 'done',
        url,
      };
      const newFileList = [...fileList, newFile];
      setFileList(newFileList);
      onChange?.(newFileList);
    }
  };

  const handleRemove = (file) => {
    const newFileList = fileList.filter((item) => item.uid !== file.uid);
    setFileList(newFileList);
    onChange?.(newFileList);
  };

  const handleChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  React.useEffect(() => {
    setFileList(value);
  }, [value]);

  return (
    <Upload
      listType={listType}
      fileList={fileList}
      customRequest={handleUpload}
      onRemove={handleRemove}
      onChange={handleChange}
      multiple={multiple}
      disabled={uploading}
      maxCount={maxCount}
      showUploadList={showUploadList}
    >
      {(!maxCount || fileList.length < maxCount) && !uploading && (
        <div>
          {uploading ? <LoadingOutlined /> : <PlusOutlined />}
          <div style={{ marginTop: 8 }}>{uploadText}</div>
        </div>
      )}
    </Upload>
  );
};

export default ImageUploader;
