import { create } from 'zustand';

const useTagsStore = create((set) => ({
  tags: [],
  isLoading: false,

  // 设置标签列表
  setTags: (tags) => {
    set({ tags });
  },

  // 设置加载状态
  setLoading: (isLoading) => {
    set({ isLoading });
  },

  // 获取标签列表（需要在调用处传入API函数）
  fetchTags: async (apiFunction) => {
    set({ isLoading: true });
    try {
      const response = await apiFunction();
      set({ tags: response.data.data, isLoading: false });
    } catch (error) {
      console.error('获取标签失败:', error);
      set({ isLoading: false });
    }
  },
}));

export default useTagsStore;
