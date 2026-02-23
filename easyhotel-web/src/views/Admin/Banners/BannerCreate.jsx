import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Upload,
  message,
} from 'antd';
import { ArrowLeftOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { createBanner, getCandidateHotels } from '../../../apis/adminApi';
import { useImageUpload } from '../../../hooks/useImageUpload';

const BannerCreate = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [fileList, setFileList] = useState([]);

  const { uploading, handleUpload: uploadImage } = useImageUpload();
  const [hotelOptions, setHotelOptions] = useState([]);

  const fetchCandidates = async () => {
    try {
      const response = await getCandidateHotels({ page: 1, pageSize: 100 });
      const data = response.data.data || {};
      const list = data.list || [];
      setHotelOptions(
        list.map(item => ({
          label: item.nameCn,
          value: item.id,
        }))
      );
    } catch (error) {
      const errorMsg = error.response?.data?.message || '获取候选酒店失败';
      message.error(errorMsg);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleCustomRequest = async ({ file, onSuccess, onError }) => {
    const url = await uploadImage({ file, onSuccess, onError });
    if (url) {
      setImageUrl(url);
      form.setFieldValue('imageUrl', url);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setFileList([]);
    form.setFieldValue('imageUrl', '');
  };

  const handleFileListChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const onFinish = async (values) => {
    if (!imageUrl) {
      message.warning('请上传Banner图片');
      return;
    }
    setLoading(true);
    try {
      await createBanner({
        hotelId: values.hotelId,
        title: values.title,
        imageUrl: imageUrl,
        isActive: values.isActive ?? true,
        displayOrder: values.displayOrder ?? 0,
      });
      message.success('创建成功');
      navigate('/admin/banners');
    } catch (error) {
      const errorMsg = error.response?.data?.message || '创建失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/banners')}>
          返回
        </Button>
        <h1 style={{ margin: 0 }}>创建Banner</h1>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            isActive: true,
            displayOrder: 0,
          }}
          style={{ maxWidth: 720 }}
        >
          <Form.Item
            label="关联酒店"
            name="hotelId"
            rules={[{ required: true, message: '请选择酒店' }]}
          >
            <Select
              placeholder="请选择候选酒店"
              options={hotelOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="例如：国庆黄金周大促" />
          </Form.Item>

          <Form.Item label="Banner图片" required>
            <Upload
              listType="picture-card"
              fileList={fileList}
              customRequest={handleCustomRequest}
              onRemove={handleRemoveImage}
              onChange={handleFileListChange}
              disabled={uploading}
              maxCount={1}
            >
              {fileList.length === 0 && !uploading && (
                <div>
                  {uploading ? <LoadingOutlined /> : <PlusOutlined />}
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
            <div style={{ color: '#999', fontSize: '12px', marginTop: 8 }}>
              建议尺寸：1200x400，支持 jpg/png/webp，最大 2MB
            </div>
          </Form.Item>

          <Form.Item label="排序值" name="displayOrder">
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="是否启用" name="isActive" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              创建Banner
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default BannerCreate;
