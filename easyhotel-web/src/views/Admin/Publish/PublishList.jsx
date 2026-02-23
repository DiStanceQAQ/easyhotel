import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Select, Space, Table, Tag, message, Popconfirm } from 'antd';
import { getPublishList, updatePublishStatus } from '../../../apis/adminApi';

const STATUS_LABEL = {
  ONLINE: '上线',
  OFFLINE: '下线',
};

const STATUS_COLOR = {
  ONLINE: 'success',
  OFFLINE: 'default',
};

const PublishList = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [query, setQuery] = useState({
    status: undefined,
  });
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchList = async (next = {}) => {
    const merged = { ...query, ...next };
    setLoading(true);
    try {
      const response = await getPublishList({
        page: merged.page || pagination.current,
        pageSize: merged.pageSize || pagination.pageSize,
        status: merged.status || undefined,
      });
      const data = response.data.data || {};
      setList(data.list || []);
      setPagination({
        current: data.page || 1,
        pageSize: data.pageSize || pagination.pageSize,
        total: data.total || 0,
      });
      setQuery(merged);
    } catch (error) {
      const errorMsg = error.response?.data?.message || '获取发布列表失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList({ page: 1, pageSize: pagination.pageSize });
  }, []);

  const handleSearch = (values) => {
    fetchList({ page: 1, status: values.status });
  };

  const handleReset = () => {
    form.resetFields();
    fetchList({ page: 1, status: undefined });
  };

  const handleTableChange = (nextPagination) => {
    fetchList({ page: nextPagination.current, pageSize: nextPagination.pageSize });
  };

  const handleToggle = async (hotelId, currentStatus) => {
    const nextStatus = currentStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    setActionLoadingId(hotelId);
    try {
      await updatePublishStatus(hotelId, { status: nextStatus });
      message.success(nextStatus === 'ONLINE' ? '已上线' : '已下线');
      fetchList();
    } catch (error) {
      const errorMsg = error.response?.data?.message || '更新状态失败';
      message.error(errorMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDetail = (hotelId) => {
    navigate(`/admin/publish/${hotelId}`);
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
      title: '发布状态',
      dataIndex: 'publishStatus',
      key: 'publishStatus',
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
      width: 140,
      render: (_, record) => (
        <Space> 
            <Popconfirm
              title={`确认将酒店${record.publishStatus === 'ONLINE' ? '下线' : '上线'}吗？`}
              onConfirm={() => handleToggle(record.id, record.publishStatus)}
              okText="确认"
              cancelText="取消"
            >
              <Button
                size="small"
                type={record.publishStatus === 'ONLINE' ? 'default' : 'primary'}
                loading={actionLoadingId === record.id}
              >
                {record.publishStatus === 'ONLINE' ? '下线' : '上线'}
              </Button>
            </Popconfirm>
            <Button
              size="small"
              loading={actionLoadingId === record.id}
              onClick={() => handleDetail(record.id)}
            >
              详情
            </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Form
        form={form}
        layout="inline"
        onFinish={handleSearch}
        initialValues={{ status: undefined }}
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="status" label="发布状态">
          <Select
            placeholder="请选择"
            allowClear
            style={{ width: 160 }}
            options={Object.keys(STATUS_LABEL).map((key) => ({
              label: STATUS_LABEL[key],
              value: key,
            }))}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

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

export default PublishList;
