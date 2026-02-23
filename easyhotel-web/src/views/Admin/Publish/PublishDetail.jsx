import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Descriptions, Image, List, Space, Spin, Tag, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getPublishDetail } from '../../../apis/adminApi';

const STATUS_LABEL = {
  ONLINE: '上线',
  OFFLINE: '下线',
};

const STATUS_COLOR = {
  ONLINE: 'success',
  OFFLINE: 'default',
};

const PublishDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const fetchDetail = async () => {
    if (!id) {
      message.error('缺少酒店ID');
      return;
    }
    setLoading(true);
    try {
      const response = await getPublishDetail(id);
      setDetail(response.data.data);
    } catch (error) {
      const errorMsg = error.response?.data?.message || '获取发布详情失败';
      message.error(errorMsg);
      navigate('/admin/publish');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const hotelImages = useMemo(() => {
    if (!detail?.images) return [];
    return detail.images
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => item.url);
  }, [detail]);

  const hotelTags = useMemo(() => {
    if (!detail?.tags) return [];
    return detail.tags.map((item) => item.name).filter(Boolean);
  }, [detail]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/publish')}>
          返回
        </Button>
        <h1 style={{ margin: 0 }}>酒店详情</h1>
      </div>

      <Card title="基础信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="酒店名称">
            {detail?.nameCn || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="英文名">
            {detail?.nameEn || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="地址">
            {detail?.address || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="城市">
            {detail?.city || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="星级">
            {detail?.star ? `${detail.star}星` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="开业时间">
            {detail?.openedAt || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="发布状态">
            <Tag color={STATUS_COLOR[detail?.publishStatus] || 'default'}>
              {STATUS_LABEL[detail?.publishStatus] || detail?.publishStatus || '-'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="商户账号">
            {detail?.merchant?.username || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="酒店标签" style={{ marginBottom: 16 }}>
        {hotelTags.length > 0 ? (
          <Space wrap>
            {hotelTags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        ) : (
          <div style={{ color: '#999' }}>暂无标签</div>
        )}
      </Card>

      <Card title="酒店图片" style={{ marginBottom: 16 }}>
        {hotelImages.length > 0 ? (
          <Image.PreviewGroup>
            <Space wrap>
              {hotelImages.map((url, index) => (
                <Image
                  key={`${url}-${index}`}
                  src={url}
                  width={160}
                  height={100}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
              ))}
            </Space>
          </Image.PreviewGroup>
        ) : (
          <div style={{ color: '#999' }}>暂无图片</div>
        )}
      </Card>

      <Card title="房型信息">
        {detail?.roomTypes?.length ? (
          <List
            dataSource={detail.roomTypes}
            renderItem={(room) => (
              <List.Item>
                <List.Item.Meta
                  title={room.name}
                  description={
                    <Space size="large" wrap>
                      <span>
                        价格：{room.basePrice} {room.currency}
                      </span>
                      <span>面积：{room.areaM2 || '-'}㎡</span>
                      <span>可住：{room.maxGuests || '-'}人</span>
                      <span>早餐：{room.breakfast ? '含' : '不含'}</span>
                      <span>可退：{room.refundable ? '可退' : '不可退'}</span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ color: '#999' }}>暂无房型</div>
        )}
      </Card>
    </div>
  );
};

export default PublishDetail;
