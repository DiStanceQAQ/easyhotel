import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Cascader,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Upload,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import areaData from 'china-area-data/data.json';
import { getTags } from '../../../apis/commonApi';
import {
  getHotelDetail,
  submitHotelAudit,
  updateHotel,
  updateHotelImages,
} from '../../../apis/merchantApi';
import { AUDIT_STATUS_LABEL, AUDIT_STATUS_COLOR } from '../../../utils/constants';
import { buildCascaderOptions, findRegionCodesByCity, getRegionLabels } from '../../../utils/regionUtils';
import { useImageUpload } from '../../../hooks/useImageUpload';
import BaiduMapPicker from '../../../components/BaiduMapPicker';

const HotelEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [detail, setDetail] = useState(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [regionLabels, setRegionLabels] = useState([]);
  const [mapPoint, setMapPoint] = useState({ lng: null, lat: null });

  const { uploading: uploadingFile, handleUpload: uploadImage } = useImageUpload();

  const regionOptions = useMemo(() => buildCascaderOptions(areaData), []);

  const canSubmit = useMemo(() => {
    if (!detail?.auditStatus) return false;
    return detail.auditStatus === 'DRAFT' || detail.auditStatus === 'REJECTED';
  }, [detail?.auditStatus]);

  const handleClearPlaceholder = (field) => () => {
    const value = form.getFieldValue(field);
    if (typeof value === 'string' && value.includes('待补充')) {
      form.setFieldsValue({ [field]: '' });
    }
  };

  const handleMapPointChange = (point) => {
    setMapPoint(point);
    form.setFieldsValue({ lng: point.lng, lat: point.lat });
  };

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const [detailResponse, tagsResponse] = await Promise.all([
        getHotelDetail(id),
        getTags(),
      ]);
      const detailData = detailResponse.data.data || {};
      const tagData = tagsResponse.data.data || {};
      setDetail(detailData);
      setTags(tagData.list || []);

      form.setFieldsValue({
        nameCn: detailData.nameCn || '',
        nameEn: detailData.nameEn || '',
        city: detailData.city || '',
        address: detailData.address || '',
        star: detailData.star || undefined,
        openedAt: detailData.openedAt ? dayjs(detailData.openedAt) : undefined,
        lat: detailData.lat || undefined,
        lng: detailData.lng || undefined,
        description: detailData.description || '',
        tagIds: detailData.tagIds || [],
        facilities: {
          wifi: detailData.facilities?.wifi || false,
          parking: detailData.facilities?.parking || false,
          gym: detailData.facilities?.gym || false,
          pool: detailData.facilities?.pool || false,
          restaurant: detailData.facilities?.restaurant || false,
          meetingRoom: detailData.facilities?.meetingRoom || false,
        },
      });

      const regionCodes = findRegionCodesByCity(regionOptions, detailData.city);
      if (regionCodes) {
        form.setFieldsValue({ region: regionCodes });
        setRegionLabels(getRegionLabels(regionOptions, regionCodes));
      } else {
        setRegionLabels([]);
      }

      const normalizedImages = (detailData.images || []).map((item, index) => ({
        uid: `${index}-${item.url}`,
        name: `image-${index + 1}`,
        status: 'done',
        url: item.url,
      }));
      setImages(normalizedImages);
    } catch (error) {
      const errorMsg = error.response?.data?.message || '获取酒店详情失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  useEffect(() => {
    if (detail?.lng && detail?.lat) {
      setMapPoint({ lng: detail.lng, lat: detail.lat });
    }
  }, [detail?.lng, detail?.lat]);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      const cityValue = regionLabels[1] || regionLabels[0] || values.city?.trim();
      const payload = {
        nameCn: values.nameCn?.trim(),
        nameEn: values.nameEn?.trim() || undefined,
        city: cityValue,
        address: values.address?.trim(),
        star: values.star,
        openedAt: values.openedAt || undefined,
        lat: values.lat,
        lng: values.lng,
        description: values.description || '',
        facilities: values.facilities || {},
        tagIds: values.tagIds || [],
      };
      await updateHotel(id, payload);
      message.success('保存成功');
      fetchDetail();
    } catch (error) {
      const errorMsg = error.response?.data?.message || '保存失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegionChange = (values, selectedOptions) => {
    const labels = (selectedOptions || []).map((item) => item.label);
    setRegionLabels(labels);
    form.setFieldsValue({
      city: selectedOptions?.[1]?.label || selectedOptions?.[0]?.label || '',
    });
  };

  const handleSaveImages = async () => {
    if (!images.length) {
      message.warning('请先上传酒店图片');
      return;
    }
    setUploading(true);
    try {
      const payload = {
        images: images.map((item, index) => ({
          url: item.url,
          sortOrder: index,
        })),
      };
      await updateHotelImages(id, payload);
      message.success('图片已保存');
    } catch (error) {
      const errorMsg = error.response?.data?.message || '保存图片失败';
      message.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitAudit = async () => {
    // 验证表单字段
    let formValues;
    try {
      formValues = await form.validateFields();
    } catch (error) {
      message.warning('请先完善必填信息后再提交审核');
      return;
    }

    if (!images.length) {
      message.warning('请先上传酒店图片后再提交审核');
      return;
    }

    setLoading(true);
    try {
      // 第一步：自动保存酒店信息
      const cityValue = regionLabels[1] || regionLabels[0] || formValues.city?.trim() || '';
      
      // 确保数据格式正确
      const hotelPayload = {
        nameCn: formValues.nameCn?.trim() || '',
        nameEn: formValues.nameEn?.trim() || undefined,
        city: cityValue,
        address: formValues.address?.trim() || '',
        star: Number(formValues.star) || 0,
        openedAt: formValues.openedAt || undefined,
        lat: formValues.lat ? Number(formValues.lat) : undefined,
        lng: formValues.lng ? Number(formValues.lng) : undefined,
        description: formValues.description?.trim() || '',
        facilities: formValues.facilities || {},
        tagIds: Array.isArray(formValues.tagIds) ? formValues.tagIds : [],
      };
      
      console.log('保存酒店信息:', hotelPayload);
      await updateHotel(id, hotelPayload);

      // 第二步：自动保存酒店图片
      const imagesPayload = {
        images: images.map((item, index) => ({
          url: item.url,
          sortOrder: index,
        })),
      };
      
      console.log('保存酒店图片:', imagesPayload);
      await updateHotelImages(id, imagesPayload);

      // 第三步：提交审核
      console.log('提交审核:', id);
      await submitHotelAudit(id);
      message.success('已保存并提交审核');
      fetchDetail();
    } catch (error) {
      console.error('提交审核失败:', error);
      const errorMsg = error.response?.data?.message || error.message || '提交审核失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async ({ file, onSuccess, onError }) => {
    const url = await uploadImage({ file, onSuccess, onError });
    if (url) {
      setImages((prev) => [
        ...prev,
        {
          uid: `${Date.now()}-${file.name}`,
          name: file.name,
          status: 'done',
          url,
        },
      ]);
    }
  };

  const handleRemoveImage = (file) => {
    setImages((prev) => prev.filter((item) => item.uid !== file.uid));
  };

  return (
    <div style={{ padding: 20 }}>
      <Space style={{ marginBottom: 16 }} align="center">
        <Button onClick={() => navigate('/merchant/hotels')}>返回列表</Button>
        {detail?.auditStatus && (
          <Tag color={AUDIT_STATUS_COLOR[detail.auditStatus] || 'default'}>
            {AUDIT_STATUS_LABEL[detail.auditStatus] || detail.auditStatus}
          </Tag>
        )}
        {detail?.rejectReason && (
          <Tooltip title={detail.rejectReason}>
            <span style={{ color: '#ff4d4f' , cursor: 'pointer'}}>查看驳回原因</span>
          </Tooltip>
        )}
      </Space>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="酒店信息" loading={loading}>
            <Form form={form} layout="vertical" onFinish={handleSave}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="中文名称"
                    name="nameCn"
                    rules={[{ required: true, message: '请输入酒店名称' }]}
                  >
                    <Input placeholder="酒店中文名称" onFocus={handleClearPlaceholder('nameCn')} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="英文名称" name="nameEn">
                    <Input placeholder="酒店英文名称" onFocus={handleClearPlaceholder('nameEn')} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="省市区"
                    name="region"
                    rules={[{ required: true, message: '请选择省市区' }]}
                  >
                    <Cascader
                      options={regionOptions}
                      placeholder="请选择省/市/区"
                      onChange={handleRegionChange}
                      showSearch
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="星级"
                    name="star"
                    rules={[{ required: true, message: '请输入星级' }]}
                  >
                    <InputNumber min={1} max={5} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="开业日期" name="openedAt">
                    <DatePicker 
                      style={{ width: '100%' }}
                      format="YYYY-MM-DD"
                      valueFormat="YYYY-MM-DD"
                      allowClear
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="city" hidden>
                <Input />
              </Form.Item>

              <Form.Item
                label="地址"
                name="address"
                rules={[{ required: true, message: '请输入地址' }]}
              >
                <Input
                  placeholder="酒店地址（无需重复填写省市区信息）"
                  onFocus={handleClearPlaceholder('address')}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="纬度" name="lat" rules={[{ required: true, message: '请输入纬度' }]}>
                    <InputNumber
                      step={0.1}
                      style={{ width: '100%' }}
                      onChange={(value) => {
                        const lng = form.getFieldValue('lng');
                        if (value && lng) {
                          setMapPoint({ lng, lat: value });
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="经度" name="lng" rules={[{ required: true, message: '请输入经度' }]}>
                    <InputNumber
                      step={0.1}
                      style={{ width: '100%' }}
                      onChange={(value) => {
                        const lat = form.getFieldValue('lat');
                        if (value && lat) {
                          setMapPoint({ lng: value, lat });
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="地图选点">
                <BaiduMapPicker
                  value={mapPoint}
                  onChange={handleMapPointChange}
                  height={260}
                  showSearch={true}
                  autoInit={!loading}
                />
              </Form.Item>

              <Form.Item label="酒店简介" name="description">
                <Input.TextArea rows={4} placeholder="请输入酒店描述" />
              </Form.Item>

              <Form.Item label="酒店标签" name="tagIds">
                <Select
                  mode="multiple"
                  placeholder="请选择标签"
                  options={tags.map((tag) => ({
                    label: tag.name,
                    value: tag.id,
                  }))}
                />
              </Form.Item>

              <Card type="inner" title="酒店设施" style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Form.Item name={['facilities', 'wifi']} valuePropName="checked">
                      <Switch checkedChildren="WiFi" unCheckedChildren="WiFi" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={['facilities', 'parking']} valuePropName="checked">
                      <Switch checkedChildren="停车" unCheckedChildren="停车" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={['facilities', 'gym']} valuePropName="checked">
                      <Switch checkedChildren="健身房" unCheckedChildren="健身房" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={['facilities', 'pool']} valuePropName="checked">
                      <Switch checkedChildren="泳池" unCheckedChildren="泳池" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={['facilities', 'restaurant']} valuePropName="checked">
                      <Switch checkedChildren="餐厅" unCheckedChildren="餐厅" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={['facilities', 'meetingRoom']} valuePropName="checked">
                      <Switch checkedChildren="会议室" unCheckedChildren="会议室" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存信息
                </Button>
                <Button onClick={() => form.resetFields()}>重置</Button>
                {canSubmit && (
                  <Popconfirm
                    title="提交审核"
                    description="将自动保存所有信息和图片并提交审核，确认继续吗？"
                    onConfirm={handleSubmitAudit}
                    okText="确认"
                    cancelText="取消"
                  >
                    <Button type="primary" danger loading={loading}>
                      保存并提交审核
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="酒店图片" loading={loading}>
            <Upload
              listType="picture-card"
              fileList={images}
              customRequest={handleUpload}
              onRemove={handleRemoveImage}
              multiple
              disabled={uploadingFile}
            >
              {!uploadingFile && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传店招和前台图片</div>
                </div>
              )}
            </Upload>
            <div style={{ marginTop: 8, marginBottom: 8, color: '#999', fontSize: 12 }}>
              提示：点击"保存并提交审核"会自动保存所有图片和信息
            </div>
            <Button
              type="primary"
              onClick={handleSaveImages}
              loading={uploading || uploadingFile}
              style={{ marginTop: 8 }}
              block
            >
              {uploadingFile ? '上传中...' : '保存图片'}
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HotelEdit;
