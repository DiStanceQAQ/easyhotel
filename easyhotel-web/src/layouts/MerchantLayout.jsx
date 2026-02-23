import React from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  ShopOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import useAuthStore from '../stores/useAuthStore';

const { Header, Sider, Content } = Layout;

const MerchantLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    {
      key: '/merchant/hotels',
      icon: <ShopOutlined />,
      label: '酒店管理',
    },
    {
      key: '/merchant/profile',
      icon: <UserOutlined />,
      label: '商户资料',
    },
  ];

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else {
      navigate(key);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div style={{ height: 32, margin: 16, color: 'white', textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>
          易宿商户端
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#ffffff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16 }}>欢迎，{user?.username}</div>
          <div style={{ cursor: 'pointer' }} onClick={handleLogout}>
            <LogoutOutlined /> 退出登录
          </div>
        </Header>
        <Content style={{ margin: '2px 5px', padding: 24, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MerchantLayout;
