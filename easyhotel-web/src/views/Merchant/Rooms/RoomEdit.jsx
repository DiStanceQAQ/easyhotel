import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Switch,
  Upload,
  message,
  Card,
  Spin,
  DatePicker,
  Table,
  Divider,
  Row,
  Col,
  Popconfirm,
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, LoadingOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getRoomDetail, updateRoom } from '../../../apis/merchantApi';
import { useImageUpload } from '../../../hooks/useImageUpload';

const RoomEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const hotelId = searchParams.get('hotelId');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [priceCalendar, setPriceCalendar] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedStock, setSelectedStock] = useState(10);

  const { uploading, uploadSingleFile } = useImageUpload();

  // 获取房型详情
  const fetchRoomDetail = async () => {
    setFetchLoading(true);
    try {
      const response = await getRoomDetail(id);
      const data = response.data.data;
      setRoomData(data);
      setImageUrl(data.coverImage || '');
      
      // 设置价格日历数据
      if (data.priceCalendar && Array.isArray(data.priceCalendar)) {
        setPriceCalendar(
          data.priceCalendar.map((item, index) => ({
            key: `${item.date}-${index}`,
            date: item.date,
            price: item.price,
            stock: item.stock,
          }))
        );
      }
      
      // 设置表单初始值
      form.setFieldsValue({
        name: data.name,
        basePrice: data.basePrice,
        maxGuests: data.maxGuests,
        areaM2: data.areaM2,
        breakfast: data.breakfast,
        refundable: data.refundable,
        status: data.status === 1,
        coverImage: data.coverImage,
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || '获取房型详情失败';
      message.error(errorMsg);
      navigate(`/merchant/hotels/${hotelId}/rooms`);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRoomDetail();
    }
  }, [id]);

  const handleUpload = async (file) => {
    const url = await uploadSingleFile(file);
    if (url) {
      setImageUrl(url);
      form.setFieldValue('coverImage', url);
    }
    return false;
  };

  // 添加价格日历项
  const handleAddCalendarItem = () => {
    if (!selectedDate) {
      message.warning('请选择日期');
      return;
    }
    if (selectedPrice === null || selectedPrice === undefined) {
      message.warning('请输入价格');
      return;
    }
    const dateStr = selectedDate.format('YYYY-MM-DD');
    // 检查是否已存在该日期
    if (priceCalendar.some(item => item.date === dateStr)) {
      message.warning('该日期已存在，请修改');
      return;
    }
    setPriceCalendar([
      ...priceCalendar,
      {
        key: `${dateStr}-${Date.now()}`,
        date: dateStr,
        price: selectedPrice,
        stock: selectedStock || 10,
      },
    ]);
    setSelectedDate(null);
    setSelectedPrice(null);
    setSelectedStock(10);
  };

  // 删除价格日历项
  const handleDeleteCalendarItem = (key) => {
    setPriceCalendar(priceCalendar.filter(item => item.key !== key));
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        name: values.name,
        basePrice: values.basePrice,
        maxGuests: values.maxGuests,
        breakfast: values.breakfast,
        refundable: values.refundable,
        areaM2: values.areaM2 || null,
        status: values.status ? 1 : 0,
        coverImage: imageUrl || null,
      };
      
      // 如果有价格日历数据，添加到payload
      if (priceCalendar.length > 0) {
        payload.priceCalendar = priceCalendar.map(item => ({
          date: item.date,
          price: item.price,
          stock: item.stock,
        }));
      }

      await updateRoom(id, payload);
      message.success('保存成功');
      const backHotelId = hotelId || roomData?.hotelId;
      navigate(`/merchant/hotels/${backHotelId}/rooms`);
    } catch (error) {
      const errorMsg = error.response?.data?.message || '保存失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const uploadButton = (
    <div>
      {uploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>上传封面</div>
    </div>
  );

  if (fetchLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const backHotelId = hotelId || roomData?.hotelId;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(`/merchant/hotels/${backHotelId}/rooms`)}
        >
          返回
        </Button>
        <h1 style={{ margin: 0 }}>编辑房型</h1>
        {roomData && (
          <span style={{ color: '#999', fontSize: '14px' }}>
            {roomData.hotelName}
          </span>
        )}
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ maxWidth: 800 }}
        >
          <Form.Item
            label="房型名称"
            name="name"
            rules={[{ required: true, message: '请输入房型名称' }]}
          >
            <Input placeholder="例如：豪华大床房" />
          </Form.Item>

          <Form.Item
            label="基础价格（元）"
            name="basePrice"
            rules={[{ required: true, message: '请输入基础价格' }]}
          >
            <InputNumber
              min={0}
              precision={0}
              style={{ width: '100%' }}
              placeholder="例如：380"
            />
          </Form.Item>

          <Form.Item
            label="最大入住人数"
            name="maxGuests"
            rules={[{ required: true, message: '请选择最大入住人数' }]}
          >
            <InputNumber
              min={1}
              max={10}
              precision={0}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="房间面积（㎡）" name="areaM2">
            <InputNumber
              min={0}
              precision={0}
              style={{ width: '100%' }}
              placeholder="例如：30"
            />
          </Form.Item>

          <Form.Item label="封面图" name="coverImage">
            <Upload
              name="coverImage"
              listType="picture-card"
              showUploadList={false}
              beforeUpload={handleUpload}
              disabled={uploading}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="封面" style={{ width: '100%' }} />
              ) : (
                uploadButton
              )}
            </Upload>
            <div style={{ color: '#999', fontSize: '12px', marginTop: 8 }}>
              建议尺寸：800x600，支持 jpg/png/webp，最大 2MB
            </div>
          </Form.Item>

          <Form.Item label="包含早餐" name="breakfast" valuePropName="checked">
            <Switch checkedChildren="含早" unCheckedChildren="无早" />
          </Form.Item>

          <Form.Item label="支持退改" name="refundable" valuePropName="checked">
            <Switch checkedChildren="可退" unCheckedChildren="不可退" />
          </Form.Item>

          <Form.Item label="上架售卖" name="status" valuePropName="checked">
            <Switch checkedChildren="上架" unCheckedChildren="下架" />
          </Form.Item>

          <Divider>库存日期管理</Divider>

          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={6}>
              <DatePicker
                style={{ width: '100%' }}
                placeholder="选择日期"
                value={selectedDate}
                onChange={setSelectedDate}
              />
            </Col>
            <Col xs={24} sm={6}>
              <InputNumber
                style={{ width: '100%' }}
                placeholder="价格"
                value={selectedPrice}
                onChange={setSelectedPrice}
                min={0}
                precision={0}
              />
            </Col>
            <Col xs={24} sm={6}>
              <InputNumber
                style={{ width: '100%' }}
                placeholder="库存数量"
                value={selectedStock}
                onChange={setSelectedStock}
                min={1}
                precision={0}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Button
                type="primary"
                onClick={handleAddCalendarItem}
                style={{ width: '100%' }}
              >
                添加
              </Button>
            </Col>
          </Row>

          {priceCalendar.length > 0 && (
            <Form.Item label="已添加的日期价格">
              <Table
                columns={[
                  {
                    title: '日期',
                    dataIndex: 'date',
                    key: 'date',
                    width: 150,
                  },
                  {
                    title: '价格(元)',
                    dataIndex: 'price',
                    key: 'price',
                    width: 100,
                  },
                  {
                    title: '库存(间)',
                    dataIndex: 'stock',
                    key: 'stock',
                    width: 100,
                  },
                  {
                    title: '操作',
                    key: 'action',
                    width: 100,
                    align: 'center',
                    render: (_, record) => (
                      <Popconfirm
                        title="删除确认"
                        description="确定要删除这条记录吗？"
                        onConfirm={() => handleDeleteCalendarItem(record.key)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    ),
                  },
                ]}
                dataSource={priceCalendar}
                pagination={false}
                size="small"
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default RoomEdit;
