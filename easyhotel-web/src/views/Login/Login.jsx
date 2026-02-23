import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.scss';
import { Button, Form, Input, notification } from 'antd';
import { login, getCurrentUser } from '../../apis/authApi.js';
import useAuthStore from '../../stores/useAuthStore.js';

export default function Login() {
    const navigate = useNavigate();
    const { login: storeLogin } = useAuthStore();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // 页面加载时恢复记住的密码
    useEffect(() => {
        const savedUsername = localStorage.getItem('savedUsername');
        const savedPassword = localStorage.getItem('savedPassword');
        if (savedUsername && savedPassword) {
            form.setFieldsValue({
                username: savedUsername,
                password: savedPassword,
                remember: true
            });
        }
    }, []);

    const onFinish = async values => {
        const { remember, ...loginData } = values;
        setLoading(true);
        try {
            let response = await login(loginData);
            let { data } = response.data;
            
            if (data && data.token ) {
                // 立即保存 token 和基础用户信息到 store
                storeLogin(data.token, data.user, null);
                
                // 然后获取完整用户信息（此时 token 已在 store 中）
                try {
                    const currentUserResponse = await getCurrentUser();
                    const fullData = currentUserResponse.data.data;
                    // 更新商户资料信息
                    storeLogin(data.token, data.user, fullData.merchantProfile);
                } catch (error) {
                    console.error('获取完整用户信息失败:', error);
                    // 如果获取失败，继续使用基础数据登录
                }

                // 记住密码处理
                if (remember) {
                    localStorage.setItem('savedUsername', values.username);
                    localStorage.setItem('savedPassword', values.password);
                } else {
                    localStorage.removeItem('savedUsername');
                    localStorage.removeItem('savedPassword');
                }
                
                notification.success({
                    title: '登录成功',
                    description: `欢迎，${data.user.username}！`,
                });
                
                // 根据角色跳转
                if (data.user.role === 'MERCHANT') {
                    navigate('/merchant/hotels');
                } else if (data.user.role === 'ADMIN') {
                    navigate('/admin/audit');
                }
            } else {
                notification.error({
                    title: '登录失败',
                    description: '用户名或密码错误！',
                });
            }
        } catch (error) {
            notification.error({
                title: '登录失败',
                description: error.response?.data?.message || '用户名或密码错误！',
            });
        } finally {
            setLoading(false);
        }
    };
    
    const onFinishFailed = errorInfo => {
        console.log('Failed:', errorInfo);
    };

    const resetForm = () => {
        form.resetFields();
        localStorage.removeItem('savedUsername');
        localStorage.removeItem('savedPassword');
    };

  return (
    <div className='login'>
      <div className='login-content'>
        <h2>易宿酒店管理系统</h2>
        <Form
            name="basic"
            form={form}
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 18 }}
            initialValues={{ 
                username: '', 
                password: '',
                remember: false
            }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            validateTrigger="onBlur"
        >
            <Form.Item
                label="账号"
                name="username"
                rules={[{ required: true, message: '请输入账号!' }]}
            >
                <Input placeholder="请输入账号" />
            </Form.Item>

            <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: '请输入密码!' }]}
            >
                <Input.Password placeholder="请输入密码" />
            </Form.Item>

            <Form.Item label={null}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Button type="primary" htmlType="submit" loading={loading} style={{ flex: 1 }}>
                        登录
                    </Button>
                    <Button htmlType="button" style={{ flex: 1 }} onClick={resetForm}>
                        取消
                    </Button>
                </div>
            </Form.Item>

            <Form.Item label={null}>
                <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
                    <Link to="/register">去注册</Link>
                </div>
            </Form.Item>
        </Form>
      </div>
    </div>
  );
}
