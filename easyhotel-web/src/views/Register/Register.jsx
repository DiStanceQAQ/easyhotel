import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Register.scss';
import { Button, Form, Input, Select, notification } from 'antd';
import { register } from '../../apis/authApi.js';

const Register = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const onFinish = async values => {
        try {
            const { confirmPassword, ...submitData } = values;
            let response = await register(submitData);
            
            notification.success({
                message: '注册成功',
                description: '账号注册成功，请登录！',
            });
            
            // 注册成功跳转到登录页
            navigate('/login');
        } catch (error) {
            notification.error({
                message: '注册失败',
                description: error.response?.data?.message || '注册失败，请稍后重试！',
            });
        }
    };
    
    const onFinishFailed = errorInfo => {
        console.log('Failed:', errorInfo);
    };

    const resetForm = () => {
        form.resetFields();
    };

  return (
    <div className='login'>
      <div className='login-content'>
        <h2>易宿酒店管理系统 - 注册</h2>
        <Form
            name="register"
            form={form}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 16 }}
            initialValues={{ 
                username: '',
                password: '',
                confirmPassword: '',
                role: 'MERCHANT'
            }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            validateTrigger="onBlur"
        >
            <Form.Item
                label="账号"
                name="username"
                rules={[
                    { required: true, message: '请输入账号!' },
                    { min: 3, message: '账号至少3个字符!' },
                    { max: 20, message: '账号最多20个字符!' }
                ]}
            >
                <Input placeholder="输入用户名" />
            </Form.Item>

            <Form.Item
                label="密码"
                name="password"
                rules={[
                    { required: true, message: '请输入密码!' },
                    { min: 6, message: '密码至少6个字符!' }
                ]}
            >
                <Input.Password placeholder="输入密码" />
            </Form.Item>

            <Form.Item
                label="确认密码"
                name="confirmPassword"
                rules={[
                    { required: true, message: '请确认密码!' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('两次输入密码不一致!'));
                        }
                    })
                ]}
            >
                <Input.Password placeholder="再次输入密码" />
            </Form.Item>

            <Form.Item
                label="角色"
                name="role"
                rules={[{ required: true, message: '请选择角色!' }]}
            >
                <Select>
                    <Select.Option value="MERCHANT">商户</Select.Option>
                    <Select.Option value="ADMIN">管理员</Select.Option>
                </Select>
            </Form.Item>

            <Form.Item label={null}>
                <Button type="primary" htmlType="submit" style={{ marginRight: '10px' }}>
                    注册
                </Button>
                <Button onClick={resetForm} style={{ marginRight: '10px' }}>
                    重置
                </Button>
                <Link to="/login">返回登录</Link>
            </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Register;