import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Button,
  Card,
  Descriptions,
  Image,
  List,
  message,
  Modal,
  Space,
  Spin,
  Tag,
  Input,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getAuditDetail, submitAudit } from '../../../apis/adminApi';

const STATUS_LABEL = {
  DRAFT: '草稿',
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '未通过',
};

const STATUS_COLOR = {
  DRAFT: 'default',
  PENDING: 'processing',
  APPROVED: 'success',
  REJECTED: 'error',
};

const FACILITY_LABELS = {
  wifi: 'WiFi',
  parking: '停车场',
  gym: '健身房',
  pool: '游泳池',
  restaurant: '餐厅',
  meetingRoom: '会议室',
};

const AuditDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchDetail = async () => {
    if (!id) {
      message.error('缺少酒店ID');
      return;
    }
    setLoading(true);
    try {
      const response = await getAuditDetail(id);
      setDetail(response.data.data);
    } catch (error) {
      const errorMsg = error.response?.data?.message || '获取审核详情失败';
      message.error(errorMsg);
      navigate('/admin/audit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const hotelImages = useMemo(() => {
    if (!detail?.hotel_images) return [];
    return detail.hotel_images
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(item => item.url);
  }, [detail]);

  const hotelTags = useMemo(() => {
    if (!detail?.hotel_tags) return [];
    return detail.hotel_tags
      .map(item => item.tags?.name)
      .filter(Boolean);
  }, [detail]);

  const facilities = useMemo(() => {
    const raw = detail?.facilities || {};
    return Object.keys(FACILITY_LABELS)
      .filter(key => raw[key])
      .map(key => FACILITY_LABELS[key]);
  }, [detail]);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await submitAudit(id, { status: 'APPROVED' });
      message.success('审核已通过');
      navigate('/admin/audit');
    } catch (error) {
      const errorMsg = error.response?.data?.message || '提交失败';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      message.warning('请输入驳回原因');
      return;
    }
    setSubmitting(true);
    try {
      await submitAudit(id, {
        status: 'REJECTED',
        rejectionReason: rejectReason.trim(),
      });
      message.success('已提交驳回');
      setRejectOpen(false);
      navigate('/admin/audit');
    } catch (error) {
      const errorMsg = error.response?.data?.message || '提交失败';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!detail) {
    return null;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/audit')}>
            返回
          </Button>
          <Tag color={STATUS_COLOR[detail.audit_status] || 'default'}>
            {STATUS_LABEL[detail.audit_status] || detail.audit_status}
          </Tag>
        </Space>
        <Space>
          <Button type="primary" onClick={handleApprove} loading={submitting}>
            通过审核
          </Button>
          <Button danger onClick={() => setRejectOpen(true)} loading={submitting}>
            驳回
          </Button>
        </Space>
      </div>

      <Card title="基础信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="酒店名称">
            {detail.name_cn}
          </Descriptions.Item>
          <Descriptions.Item label="英文名">
            {detail.name_en || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="城市">
            {detail.city || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="地址">
            {detail.address || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="星级">
            {detail.star ? `${detail.star}星` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="开业时间">
            {detail.opened_at ? dayjs(detail.opened_at).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="经纬度">
            {detail.lat && detail.lng ? `${detail.lat}, ${detail.lng}` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="商户账号">
            {detail.users_hotels_merchant_idTousers?.username || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="驳回原因" span={2}>
            {detail.reject_reason || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="酒店标签" style={{ marginBottom: 16 }}>
        {hotelTags.length > 0 ? (
          <Space wrap>
            {hotelTags.map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        ) : (
          <span>暂无标签</span>
        )}
      </Card>

      <Card title="设施" style={{ marginBottom: 16 }}>
        {facilities.length > 0 ? (
          <Space wrap>
            {facilities.map(item => (
              <Tag key={item} color="blue">
                {item}
              </Tag>
            ))}
          </Space>
        ) : (
          <span>暂无设施</span>
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
                  width={120}
                  height={90}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
              ))}
            </Space>
          </Image.PreviewGroup>
        ) : (
          <span>暂无图片</span>
        )}
      </Card>

      <Card title="房型信息" style={{ marginBottom: 16 }}>
        <List
          dataSource={detail.room_types || []}
          locale={{ emptyText: '暂无房型' }}
          renderItem={(room) => (
            <List.Item>
              <List.Item.Meta
                title={room.name}
                description={
                  <Space wrap>
                    <span>价格：{room.base_price}</span>
                    <span>人数：{room.max_guests}</span>
                    <span>{room.breakfast ? '含早' : '无早'}</span>
                    <span>{room.refundable ? '可退' : '不可退'}</span>
                    <span>面积：{room.area_m2 || '-'}㎡</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Card title="酒店描述">
        <div
          style={{ color: '#333', lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{
            __html: detail.description || '<span>暂无描述</span>',
          }}
        />
      </Card>

      <Modal
        title="驳回原因"
        open={rejectOpen}
        onOk={handleReject}
        onCancel={() => setRejectOpen(false)}
        confirmLoading={submitting}
        okText="提交"
        cancelText="取消"
      >
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder="请输入驳回原因（必填）"
          maxLength={200}
          showCount
        />
      </Modal>
    </div>
  );
};

export default AuditDetail;
