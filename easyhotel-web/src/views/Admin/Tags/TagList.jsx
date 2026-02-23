import React from 'react';
import { useEffect, useState } from 'react';
import useTagsStore from '../../../stores/useTagsStore';
import { getTags } from '../../../apis/commonApi';
import { deleteTag, createTag } from '../../../apis/adminApi';
import { Button, Table, message, Modal, Input, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { data } from 'react-router-dom';

const TagList = () => {
  const { tags, fetchTags } = useTagsStore();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [tagName, setTagName] = useState('');

  useEffect(() => {
    fetchTags(getTags);
  }, []);

  const handleDelete = async (tagId) => {
    setLoading(true);
    try {
      await deleteTag(tagId);
      message.success('删除成功');
      fetchTags(getTags);
    } catch (error) {
      const errorMsg = error.response?.data?.message || '删除失败';
      message.error(errorMsg);
      console.error('删除标签失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!tagName.trim()) {
      message.warning('请输入标签名称');
      return;
    }

    setLoading(true);
    try {
      const data = await createTag({ name: tagName });
      console.log('添加标签成功:', data);
      message.success('添加成功');
      setTagName('');
      setModalOpen(false);
      fetchTags(getTags);
    } catch (error) {
      const errorMsg = error.response?.data?.message || '添加失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Popconfirm
          title="删除标签"
          description="确认删除该标签吗？"
          onConfirm={() => handleDelete(record.id)}
          okText="确认"
          cancelText="取消"
        >
          <Button 
            type="text" 
            danger 
            size="small" 
            icon={<DeleteOutlined />}
            loading={loading}
          >
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          添加标签
        </Button>
      </div>

      <Modal
        title="添加标签"
        open={modalOpen}
        onOk={handleAddTag}
        onCancel={() => {
          setModalOpen(false);
          setTagName('');
        }}
        confirmLoading={loading}
        okText="确认"
        cancelText="取消"
      >
        <Input
          placeholder="请输入标签名称"
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          onPressEnter={handleAddTag}
        />
      </Modal>

      {tags && tags.list ? (
        <Table
          columns={columns}
          dataSource={tags.list}
          rowKey="id"
          pagination={{ 
            pageSize: 10
        }}
        />
      ) : (
        <p>暂无数据</p>
      )}
    </div>
  );
};

export default TagList;
