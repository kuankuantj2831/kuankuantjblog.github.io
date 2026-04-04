import { apiClient } from './client';
import { Article, ApiResponse } from '../types';

export interface GetArticlesParams {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  search?: string;
}

export const articleApi = {
  // 获取文章列表
  getArticles: async (params: GetArticlesParams): Promise<{ articles: Article[]; total: number }> => {
    const response = await apiClient.get('/articles', { params });
    return response.data;
  },

  // 获取文章详情
  getArticle: async (id: string): Promise<Article> => {
    const response = await apiClient.get(`/articles/${id}`);
    return response.data.data;
  },

  // 点赞文章
  likeArticle: async (id: string): Promise<void> => {
    await apiClient.post(`/articles/${id}/like`);
  },

  // 收藏文章
  favoriteArticle: async (id: string): Promise<void> => {
    await apiClient.post(`/articles/${id}/favorite`);
  },

  // 获取文章评论
  getComments: async (id: string, page = 1, limit = 20): Promise<any> => {
    const response = await apiClient.get(`/articles/${id}/comments`, {
      params: { page, limit },
    });
    return response.data;
  },

  // 发表评论
  postComment: async (id: string, content: string, parentId?: string): Promise<void> => {
    await apiClient.post(`/articles/${id}/comments`, {
      content,
      parent_id: parentId,
    });
  },

  // 获取热门文章
  getHotArticles: async (limit = 10): Promise<Article[]> => {
    const response = await apiClient.get('/articles/hot', { params: { limit } });
    return response.data.data;
  },

  // 获取推荐文章
  getRecommendedArticles: async (limit = 10): Promise<Article[]> => {
    const response = await apiClient.get('/articles/recommended', { params: { limit } });
    return response.data.data;
  },
};
