import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Table,
  Space,
  Tag,
  Image,
  Switch,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import {
  getHotelRooms,
  updateRoomStatus,
} from '../../../apis/merchantApi';

const RoomList = () => {
  const navigate = useNavigate();
  const { hotelId } = useParams();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hotelName, setHotelName] = useState('');

  const fetchRooms = async () => {
    if (!hotelId) {
      message.error('缺少酒店ID');
      return;
    }
    setLoading(true);
    try {
      const response = await getHotelRooms(hotelId);
      const data = response.data.data || {};
      setList(data.list || []);
    } catch (error) {
      const errorMsg = error.response?.data?.message || '获取房型列表失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [hotelId]);

  const handleStatusChange = async (roomId, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      await updateRoomStatus(roomId, { status: newStatus });
      message.success(newStatus === 1 ? '已上架' : '已下架');
      fetchRooms();
    } catch (error) {
      const errorMsg = error.response?.data?.message || '状态修改失败';
      message.error(errorMsg);
    }
  };

  const columns = [
    {
      title: '封面图',
      dataIndex: 'coverImage',
      key: 'coverImage',
      width: 100,
      render: (url) => 
        url ? (
          <Image
            src={url}
            alt="房型封面"
            width={60}
            height={60}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <div style={{ 
            width: 60, 
            height: 60, 
            background: '#f0f0f0', 
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999'
          }}>
            暂无
          </div>
        ),
    },
    {
      title: '房型名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: '基础价格',
      dataIndex: 'basePrice',
      key: 'basePrice',
      width: 120,
      render: (price) => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{price}</span>,
    },
    {
      title: '最大入住',
      dataIndex: 'maxGuests',
      key: 'maxGuests',
      width: 100,
      render: (num) => `${num}人`,
    },
    {
      title: '面积',
      dataIndex: 'areaM2',
      key: 'areaM2',
      width: 100,
      render: (area) => area ? `${area}㎡` : '-',
    },
    {
      title: '早餐',
      dataIndex: 'breakfast',
      key: 'breakfast',
      width: 80,
      render: (breakfast) => (
        <Tag color={breakfast ? 'success' : 'default'}>
          {breakfast ? '含早' : '无早'}
        </Tag>
      ),
    },
    {
      title: '退改',
      dataIndex: 'refundable',
      key: 'refundable',
      width: 80,
      render: (refundable) => (
        <Tag color={refundable ? 'success' : 'warning'}>
          {refundable ? '可退' : '不可退'}
        </Tag>
      ),
    },
    {
      title: '售卖状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => (
        <Popconfirm
          title={`确认${status === 1 ? '下架' : '上架'}该房型吗？`}
          onConfirm={() => handleStatusChange(record.id, status)}
          okText="确认"
          cancelText="取消"
        >
          <Switch 
            checked={status === 1} 
            checkedChildren="上架" 
            unCheckedChildren="下架"
          />
        </Popconfirm>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            onClick={() => navigate(`/merchant/rooms/${record.id}/edit?hotelId=${hotelId}`)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/merchant/hotels')}
          >
            返回酒店列表
          </Button>
          <h1 style={{ margin: 0 }}>房型管理</h1>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => navigate(`/merchant/rooms/create?hotelId=${hotelId}`)}
        >
          创建房型
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
    </div>
  );
};

export default RoomList;
