import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Upload,
  message,
  Spin,
} from 'antd';
import { ArrowLeftOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { getBanners, updateBanner } from '../../../apis/adminApi';
import { useImageUpload } from '../../../hooks/useImageUpload';

const BannerEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [fileList, setFileList] = useState([]);
  const [banner, setBanner] = useState(null);

  const { uploading, handleUpload: uploadImage } = useImageUpload();

  const fetchBanner = async () => {
    setFetchLoading(true);
    try {
      const response = await getBanners({ page: 1, pageSize: 200 });
      const data = response.data.data || {};
      const list = data.list || [];
      const found = list.find(item => String(item.id) === String(id));
      if (!found) {
        message.error('未找到Banner');
        navigate('/admin/banners');
        return;
      }

      setBanner(found);
      setImageUrl(found.imageUrl || '');
      if (found.imageUrl) {
        setFileList([{
          uid: '-1',
          name: 'banner.jpg',
          status: 'done',
          url: found.imageUrl,
        }]);
      }
      form.setFieldsValue({
        title: found.title,
        imageUrl: found.imageUrl,
        displayOrder: found.displayOrder ?? 0,
        isActive: found.isActive,
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || '获取Banner失败';
      message.error(errorMsg);
      navigate('/admin/banners');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchBanner();
  }, [id]);

  const handleImageUpload = async ({ file, onSuccess, onError }) => {
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
      message.warning('\u8bf7上传Banner图片');
      return;
    }
    setLoading(true);
    try {
      await updateBanner(id, {
        title: values.title,
        imageUrl: imageUrl,
        isActive: values.isActive,
        displayOrder: values.displayOrder ?? 0,
      });
      message.success('保存成功');
      navigate('/admin/banners');
    } catch (error) {
      const errorMsg = error.response?.data?.message || '保存失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/banners')}>
          返回
        </Button>
        <h1 style={{ margin: 0 }}>编辑Banner</h1>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ maxWidth: 720 }}
        >
          <Form.Item label="关联酒店">
            <Input value={banner?.hotel?.nameCn || '-'} disabled />
          </Form.Item>

          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="宣传标题(如国庆大促)" />
          </Form.Item>

          <Form.Item label="Banner图片" required>
            <Upload
              listType="picture-card"
              fileList={fileList}
              customRequest={handleImageUpload}
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
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default BannerEdit;
