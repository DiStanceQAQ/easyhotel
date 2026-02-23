import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';

// 首页
import MerchantLayout from '../layouts/MerchantLayout';
import AdminLayout from '../layouts/AdminLayout';

// 路由控制跳转
import ProtectedRoute from './RouterGuard/ProtectedRoute';
import RoleGuard from './RouterGuard/RoleGuard';

// 公共页面（注册登录）- 不做懒加载（首屏需要）
import Login from '../views/Login/Login';
import Register from '../views/Register/Register';

// 懒加载商户页面
const HotelList = lazy(() => import('../views/Merchant/Hotels/HotelList'));
const HotelEdit = lazy(() => import('../views/Merchant/Hotels/HotelEdit'));
const HotelCreate = lazy(() => import('../views/Merchant/Hotels/HotelCreate'));
const RoomList = lazy(() => import('../views/Merchant/Rooms/RoomList'));
const RoomEdit = lazy(() => import('../views/Merchant/Rooms/RoomEdit'));
const RoomCreate = lazy(() => import('../views/Merchant/Rooms/RoomCreate'));
const Profile = lazy(() => import('../views/Merchant/Profile/Profile'));

// 懒加载管理员页面
const AuditList = lazy(() => import('../views/Admin/Audit/AuditList'));
const AuditDetail = lazy(() => import('../views/Admin/Audit/AuditDetail'));
const PublishList = lazy(() => import('../views/Admin/Publish/PublishList'));
const PublishDetail = lazy(() => import('../views/Admin/Publish/PublishDetail'));
const BannerList = lazy(() => import('../views/Admin/Banners/BannerList'));
const BannerEdit = lazy(() => import('../views/Admin/Banners/BannerEdit'));
const BannerCreate = lazy(() => import('../views/Admin/Banners/BannerCreate'));
const TagList = lazy(() => import('../views/Admin/Tags/TagList'));

// 懒加载Fallback组件
const RouteLoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100%',
  }}>
    <Spin size="large" tip="加载中..." />
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login', // 登录
    element: <Login />,
  },
  {
    path: '/register', // 注册
    element: <Register />,
  },
  // 商户端路由
  {
    path: '/merchant',
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['MERCHANT']}>
          <MerchantLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/merchant/hotels" replace />,
      },
      {
        path: 'hotels', // 酒店列表
        element: <Suspense fallback={<RouteLoadingFallback />}><HotelList /></Suspense>,
      },
      {
        path: 'hotels/create', // 创建酒店
        element: <Suspense fallback={<RouteLoadingFallback />}><HotelCreate /></Suspense>,
      },
      {
        path: 'hotels/:id/edit', // 编辑酒店
        element: <Suspense fallback={<RouteLoadingFallback />}><HotelEdit /></Suspense>,
      },
      {
        path: 'hotels/:hotelId/rooms', // 房型列表
        element: <Suspense fallback={<RouteLoadingFallback />}><RoomList /></Suspense>,
      },
      {
        path: 'rooms/create', // 创建房型
        element: <Suspense fallback={<RouteLoadingFallback />}><RoomCreate /></Suspense>,
      },
      {
        path: 'rooms/:id/edit', // 编辑房型
        element: <Suspense fallback={<RouteLoadingFallback />}><RoomEdit /></Suspense>,
      },
      {
        path: 'profile', // 商户资料
        element: <Suspense fallback={<RouteLoadingFallback />}><Profile /></Suspense>,
      },
    ],
  },
  // 管理员端路由
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['ADMIN']}>
          <AdminLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/audit" replace />,
      },
      {
        path: 'audit', // 审核列表
        element: <Suspense fallback={<RouteLoadingFallback />}><AuditList /></Suspense>,
      },
      {
        path: 'audit/:id', // 审核详情
        element: <Suspense fallback={<RouteLoadingFallback />}><AuditDetail /></Suspense>,
      },
      {
        path: 'publish', // 发布管理
        element: <Suspense fallback={<RouteLoadingFallback />}><PublishList /></Suspense>,
      },
      {
        path: 'publish/:id', // 发布详情
        element: <Suspense fallback={<RouteLoadingFallback />}><PublishDetail /></Suspense>,
      },
      {
        path: 'banners', // Banner列表
        element: <Suspense fallback={<RouteLoadingFallback />}><BannerList /></Suspense>,
      },
      {
        path: 'banners/create', // 创建Banner
        element: <Suspense fallback={<RouteLoadingFallback />}><BannerCreate /></Suspense>,
      },
      {
        path: 'banners/:id/edit', // 编辑Banner
        element: <Suspense fallback={<RouteLoadingFallback />}><BannerEdit /></Suspense>,
      },
      {
        path: 'tags', // 标签管理
        element: <Suspense fallback={<RouteLoadingFallback />}><TagList /></Suspense>,
      },
    ],
  },
  // 404
  {
    path: '*',
    element: <div>404 - 页面不存在</div>,
  },
]);

export default router;
