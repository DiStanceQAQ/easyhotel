import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Switch,
  Upload,
  message,
  Card,
  DatePicker,
  Table,
  Space,
  Popconfirm,
  Row,
  Col,
  Divider,
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, LoadingOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { createRoom } from '../../../apis/merchantApi';
import { useImageUpload } from '../../../hooks/useImageUpload';

const RoomCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hotelId = searchParams.get('hotelId');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [priceCalendar, setPriceCalendar] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedStock, setSelectedStock] = useState(10);

  const { uploading, uploadSingleFile } = useImageUpload();

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
    if (!hotelId) {
      message.error('缺少酒店ID');
      return;
    }
    if (!imageUrl) {
      message.error('请上传封面图');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        hotelId,
        name: values.name,
        basePrice: values.basePrice,
        maxGuests: values.maxGuests,
        breakfast: values.breakfast ?? false,
        refundable: values.refundable ?? true,
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

      await createRoom(payload);
      message.success('创建成功');
      navigate(`/merchant/hotels/${hotelId}/rooms`);
    } catch (error) {
      const errorMsg = error.response?.data?.message || '创建房型失败';
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

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(`/merchant/hotels/${hotelId}/rooms`)}
        >
          返回
        </Button>
        <h1 style={{ margin: 0 }}>创建房型</h1>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            breakfast: false,
            refundable: true,
            status: true,
            maxGuests: 2,
          }}
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

          <Divider>库存日期管理（可选）</Divider>

          <Card 
            size="small" 
            style={{ marginBottom: 16, backgroundColor: '#fafafa' }}
            title="设置不同日期的价格和库存"
          >
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={6}>
                <DatePicker
                  placeholder="选择日期"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Col>
              <Col xs={24} sm={6}>
                <InputNumber
                  placeholder="价格"
                  value={selectedPrice}
                  onChange={setSelectedPrice}
                  min={0}
                  precision={0}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={6}>
                <InputNumber
                  placeholder="库存"
                  value={selectedStock}
                  onChange={setSelectedStock}
                  min={0}
                  precision={0}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Button type="primary" onClick={handleAddCalendarItem} style={{ width: '100%' }}>
                  添加
                </Button>
              </Col>
            </Row>

            {priceCalendar.length > 0 && (
              <Table
                columns={[
                  {
                    title: '日期',
                    dataIndex: 'date',
                    key: 'date',
                    width: '30%',
                  },
                  {
                    title: '价格（元）',
                    dataIndex: 'price',
                    key: 'price',
                    width: '25%',
                  },
                  {
                    title: '库存',
                    dataIndex: 'stock',
                    key: 'stock',
                    width: '20%',
                  },
                  {
                    title: '操作',
                    key: 'action',
                    width: '25%',
                    render: (_, record) => (
                      <Popconfirm
                        title="确定删除？"
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
                locale={{ emptyText: '暂无数据' }}
              />
            )}
          </Card>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              创建房型
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default RoomCreate;
