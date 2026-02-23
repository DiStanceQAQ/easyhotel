/**
 * 审核状态常量
 */
export const AUDIT_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const AUDIT_STATUS_LABEL = {
  [AUDIT_STATUS.DRAFT]: '草稿',
  [AUDIT_STATUS.PENDING]: '审核中',
  [AUDIT_STATUS.APPROVED]: '已通过',
  [AUDIT_STATUS.REJECTED]: '未通过',
};

export const AUDIT_STATUS_COLOR = {
  [AUDIT_STATUS.DRAFT]: 'default',
  [AUDIT_STATUS.PENDING]: 'processing',
  [AUDIT_STATUS.APPROVED]: 'success',
  [AUDIT_STATUS.REJECTED]: 'error',
};

/**
 * 发布状态常量
 */
export const PUBLISH_STATUS = {
  PUBLISHED: 'PUBLISHED',
  UNPUBLISHED: 'UNPUBLISHED',
};

export const PUBLISH_STATUS_LABEL = {
  [PUBLISH_STATUS.PUBLISHED]: '已发布',
  [PUBLISH_STATUS.UNPUBLISHED]: '已下架',
};

export const PUBLISH_STATUS_COLOR = {
  [PUBLISH_STATUS.PUBLISHED]: 'success',
  [PUBLISH_STATUS.UNPUBLISHED]: 'default',
};
