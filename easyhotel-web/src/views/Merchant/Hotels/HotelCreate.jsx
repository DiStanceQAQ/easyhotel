import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, message, Card } from 'antd';
import { createHotel } from '../../../apis/merchantApi';

const HotelCreate = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleCreate = async (values) => {
    setLoading(true);
    try {
      const response = await createHotel({ nameCn: values.nameCn.trim() });
      const data = response.data.data || {};
      message.success('创建成功');
      if (data.id) {
        navigate(`/merchant/hotels/${data.id}/edit`);
      } else {
        navigate('/merchant/hotels');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || '创建酒店失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="创建酒店" style={{ maxWidth: 720 }}>
      <Form form={form} layout="vertical" onFinish={handleCreate}>
        <Form.Item
          label="酒店名称"
          name="nameCn"
          rules={[{ required: true, message: '请输入酒店名称' }]}
        >
          <Input placeholder="例如：易宿酒店(深圳南山店)" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            创建并进入编辑
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default HotelCreate;
