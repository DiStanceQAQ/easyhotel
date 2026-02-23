import React from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AuditOutlined,
  CloudUploadOutlined,
  PictureOutlined,
  TagsOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import useAuthStore from '../stores/useAuthStore';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    {
      key: '/admin/audit',
      icon: <AuditOutlined />,
      label: '酒店审核',
    },
    {
      key: '/admin/publish',
      icon: <CloudUploadOutlined />,
      label: '发布管理',
    },
    {
      key: '/admin/banners',
      icon: <PictureOutlined />,
      label: 'Banner管理',
    },
    {
      key: '/admin/tags',
      icon: <TagsOutlined />,
      label: '标签管理',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div style={{ height: 32, margin: 16, color: 'white', textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>
          易宿管理端
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
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16 }}>欢迎，{user?.username}</div>
          <div style={{ cursor: 'pointer' }} onClick={handleLogout}>
            <LogoutOutlined /> 退出登录
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
