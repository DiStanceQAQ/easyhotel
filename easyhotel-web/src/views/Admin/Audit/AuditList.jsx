import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Table, Tag, message } from 'antd';
import { getAuditList } from '../../../apis/adminApi';

const STATUS_LABEL = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '未通过',
  DRAFT: '草稿',
};

const STATUS_COLOR = {
  PENDING: 'processing',
  APPROVED: 'success',
  REJECTED: 'error',
  DRAFT: 'default',
};

const AuditList = () => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchList = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await getAuditList({ page, pageSize });
      const data = response.data.data || {};
      setList(data.list || []);
      setPagination({
        current: data.page || page,
        pageSize: data.pageSize || pageSize,
        total: data.total || 0,
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || '获取审核列表失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleTableChange = (nextPagination) => {
    fetchList(nextPagination.current, nextPagination.pageSize);
  };

  const columns = [
    {
      title: '酒店名称',
      dataIndex: 'nameCn',
      key: 'nameCn',
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: '英文名',
      dataIndex: 'nameEn',
      key: 'nameEn',
      render: (text) => text || '-',
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      render: (text) => text || '-',
    },
    {
      title: '商户账号',
      dataIndex: ['merchant', 'username'],
      key: 'merchant',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      width: 120,
      render: (status) => (
        <Tag color={STATUS_COLOR[status] || 'default'}>
          {STATUS_LABEL[status] || status || '-'}
        </Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value) => (value ? new Date(value).toLocaleString() : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="primary"
            onClick={() => navigate(`/admin/audit/${record.id}`)}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Button onClick={() => fetchList(pagination.current, pagination.pageSize)}>
          刷新
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

export default AuditList;
