import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  createHotel,
  getHotelDetail,
  getMyHotels,
  submitHotelAudit,
} from '../../../apis/merchantApi';
import {
  AUDIT_STATUS_LABEL,
  AUDIT_STATUS_COLOR,
  PUBLISH_STATUS_LABEL,
  PUBLISH_STATUS_COLOR,
} from '../../../utils/constants';

const HotelList = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState({
    page: 1,
    pageSize: 10,
    name: '',
    auditStatus: undefined,
  });
  const [listLoading, setListLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchList = async (next = {}) => {
    const merged = { ...query, ...next };
    setListLoading(true);
    try {
      const response = await getMyHotels({
        page: merged.page,
        pageSize: merged.pageSize,
        name: merged.name || undefined,
        auditStatus: merged.auditStatus || undefined,
      });
      const data = response.data.data || {};
      setList(data.list || []);
      setTotal(data.total || 0);
      setQuery(merged);
    } catch (error) {
      const errorMsg = error.response?.data?.message || '获取酒店列表失败';
      message.error(errorMsg);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleSearch = (values) => {
    fetchList({ page: 1, ...values });
  };

  const handleReset = () => {
    form.resetFields();
    fetchList({ page: 1, name: '', auditStatus: undefined });
  };

  const handleTableChange = (pagination) => {
    fetchList({ page: pagination.current, pageSize: pagination.pageSize });
  };

  const handleCreateHotel = async () => {
    if (!createName.trim()) {
      message.warning('请输入酒店名称');
      return;
    }

    setCreateLoading(true);
    try {
      const response = await createHotel({ nameCn: createName.trim() });
      const data = response.data.data || {};
      message.success('创建成功');
      setCreateOpen(false);
      setCreateName('');
      if (data.id) {
        navigate(`/merchant/hotels/${data.id}/edit`);
      } else {
        fetchList();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || '创建酒店失败';
      message.error(errorMsg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSubmitAudit = async (hotelId) => {
    setActionLoadingId(hotelId);
    try {
      // 先获取完整酒店信息进行验证
      const response = await getHotelDetail(hotelId);
      const hotel = response.data.data || {};

      // 验证必填字段
      const missingFields = [];
      if (!hotel.nameCn) missingFields.push('酒店名称');
      if (!hotel.city) missingFields.push('城市');
      if (!hotel.address) missingFields.push('地址');
      if (!hotel.star) missingFields.push('星级');
      if (!hotel.tagIds || hotel.tagIds.length === 0) missingFields.push('标签');

      if (missingFields.length > 0) {
        message.warning(`请先完善以下信息后再提交审核: ${missingFields.join('、')}`);
        setActionLoadingId(null);
        return;
      }

      // 检查是否有图片
      if (!hotel.images || hotel.images.length === 0) {
        message.warning('请先上传酒店图片后再提交审核');
        setActionLoadingId(null);
        return;
      }

      await submitHotelAudit(hotelId);
      message.success('已提交审核');
      fetchList();
    } catch (error) {
      const errorMsg = error.response?.data?.message || '提交审核失败';
      message.error(errorMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const columns = [
    {
      title: '酒店名称',
      dataIndex: 'nameCn',
      key: 'nameCn',
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '星级',
      dataIndex: 'star',
      key: 'star',
      width: 80,
      render: (value) => (value ? `${value}星` : '-'),
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      width: 120,
      render: (status) => (
        <Tag color={AUDIT_STATUS_COLOR[status] || 'default'}>
          {AUDIT_STATUS_LABEL[status] || status}
        </Tag>
      ),
    },
    {
      title: '发布状态',
      dataIndex: 'publishStatus',
      key: 'publishStatus',
      width: 120,
      render: (status) => (
        <Tag color={PUBLISH_STATUS_COLOR[status] || 'default'}>
          {PUBLISH_STATUS_LABEL[status] || status || '-'}
        </Tag>
      ),
    },
    {
      title: '驳回原因',
      dataIndex: 'rejectReason',
      key: 'rejectReason',
      width: 160,
      render: (reason) =>
        reason ? (
          <Tooltip title={reason}>
            <span style={{ color: '#ff4d4f' }}>查看原因</span>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => {
        const canSubmit = record.auditStatus === 'DRAFT' || record.auditStatus === 'REJECTED';
        const canManageRooms = record.auditStatus === 'APPROVED';
        return (
          <Space>
            <Button size="small" onClick={() => navigate(`/merchant/hotels/${record.id}/edit`)}>
              编辑
            </Button>
            {canManageRooms ? (
              <Button
                size="small"
                onClick={() => navigate(`/merchant/hotels/${record.id}/rooms`)}
              >
                房型
              </Button>
            ) : (
              <Tooltip title="审核通过后可编辑房型">
                <span>
                  <Button size="small" disabled>
                    房型
                  </Button>
                </span>
              </Tooltip>
            )}
            {canSubmit && (
              <Popconfirm
                title="提交审核"
                description="确认提交该酒店审核吗？"
                onConfirm={() => handleSubmitAudit(record.id)}
                okText="确认"
                cancelText="取消"
              >
                <Button
                  size="small"
                  type="primary"
                  loading={actionLoadingId === record.id}
                >
                  提交审核
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Form
        form={form}
        layout="inline"
        onFinish={handleSearch}
        initialValues={{ name: '', auditStatus: undefined }}
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="name" label="酒店名称">
          <Input placeholder="请输入酒店名称" allowClear />
        </Form.Item>
        <Form.Item name="auditStatus" label="审核状态">
          <Select
            placeholder="请选择"
            allowClear
            style={{ width: 160 }}
            options={Object.keys(AUDIT_STATUS_LABEL).map((key) => ({
              label: AUDIT_STATUS_LABEL[key],
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

      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          创建酒店
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        loading={listLoading}
        pagination={{
          current: query.page,
          pageSize: query.pageSize,
          total,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title="创建酒店"
        open={createOpen}
        onOk={handleCreateHotel}
        onCancel={() => {
          setCreateOpen(false);
          setCreateName('');
        }}
        confirmLoading={createLoading}
        okText="创建"
        cancelText="取消"
      >
        <Input
          placeholder="请输入酒店名称"
          value={createName}
          onChange={(event) => setCreateName(event.target.value)}
          onPressEnter={handleCreateHotel}
        />
      </Modal>
    </div>
  );
};

export default HotelList;
