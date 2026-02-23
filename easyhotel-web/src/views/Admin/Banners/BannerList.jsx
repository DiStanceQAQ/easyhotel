import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Image, Popconfirm, Space, Table, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { deleteBanner, getBanners } from '../../../apis/adminApi';

const BannerList = () => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchList = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await getBanners({ page, pageSize });
      const data = response.data.data || {};
      setList(data.list || []);
      setPagination({
        current: data.page || page,
        pageSize: data.pageSize || pageSize,
        total: data.total || 0,
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || '获取Banner列表失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleDelete = async (bannerId) => {
    setActionLoadingId(bannerId);
    try {
      await deleteBanner(bannerId);
      message.success('已删除');
      fetchList(pagination.current, pagination.pageSize);
    } catch (error) {
      const errorMsg = error.response?.data?.message || '删除失败';
      message.error(errorMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTableChange = (nextPagination) => {
    fetchList(nextPagination.current, nextPagination.pageSize);
  };

  const columns = [
    {
      title: '预览图',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 120,
      render: (url) =>
        url ? (
          <Image
            src={url}
            width={90}
            height={50}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <div
            style={{
              width: 90,
              height: 50,
              background: '#f0f0f0',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
            }}
          >
            暂无
          </div>
        ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text) => text || '-',
    },
    {
      title: '关联酒店',
      dataIndex: 'hotel',
      key: 'hotel',
      render: (hotel) => hotel?.nameCn || '-',
    },
    {
      title: '排序',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 80,
      render: (value) => (value ?? 0),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (value) => (
        <Tag color={value ? 'success' : 'default'}>
          {value ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => navigate(`/admin/banners/${record.id}/edit`)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该Banner吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button
              size="small"
              danger
              loading={actionLoadingId === record.id}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/banners/create')}>
          创建Banner
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default BannerList;
