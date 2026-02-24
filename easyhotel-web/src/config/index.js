// API 基础路径：优先读部署环境变量，未配置则回退本地开发地址
const fallbackBaseURL = 'http://localhost:3000/api';
const configuredBaseURL = process.env.REACT_APP_API_BASE_URL?.trim();

export const baseURL =
  configuredBaseURL && configuredBaseURL.length > 0
    ? configuredBaseURL.replace(/\/+$/, '')
    : fallbackBaseURL;
