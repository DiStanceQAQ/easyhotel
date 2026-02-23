import React, { useState, useEffect } from 'react';
import { Button, Form, Input, notification } from 'antd';
import { updateMerchantProfile } from '../../../apis/authApi';
import useAuthStore from '../../../stores/useAuthStore';

const Profile = () => {
  const { merchantProfile, updateMerchantProfile: storeUpdateProfile } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 回显数据
  useEffect(() => {
    if (merchantProfile) {
      form.setFieldsValue({
        merchantName: merchantProfile.merchantName || '',
        contactName: merchantProfile.contactName || '',
        contactPhone: merchantProfile.contactPhone || '',
      });
    }
  }, [merchantProfile, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await updateMerchantProfile(values);
      
      // 更新store
      storeUpdateProfile(values);
      
      notification.success({
        message: '保存成功',
        description: '商户资料已更新！',
      });
    } catch (error) {
      notification.error({
        message: '保存失败',
        description: error.response?.data?.message || '保存失败，请重试！',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          label="商户名称"
          name="merchantName"
          rules={[{ required: true, message: '请输入商户名称!' }]}
        >
          <Input placeholder="请输入商户名称" />
        </Form.Item>

        <Form.Item
          label="联系人"
          name="contactName"
        >
          <Input placeholder="请输入联系人姓名" />
        </Form.Item>

        <Form.Item
          label="联系电话"
          name="contactPhone"
          rules={[
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号!' }
          ]}
        >
          <Input placeholder="请输入联系电话" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            保存
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => form.resetFields()}>
            重置
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Profile;
