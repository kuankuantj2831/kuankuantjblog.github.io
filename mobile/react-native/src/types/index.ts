// 文章类型
export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  cover_image?: string;
  author: User;
  category: Category;
  tags: Tag[];
  view_count: number;
  like_count: number;
  comment_count: number;
  favorite_count: number;
  created_at: string;
  updated_at: string;
  is_premium?: boolean;
  is_paid?: boolean;
}

// 用户类型
export interface User {
  id: string;
  username: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  bio?: string;
  level?: number;
  exp?: number;
  coins?: number;
  followers_count?: number;
  following_count?: number;
  articles_count?: number;
  created_at?: string;
}

// 分类类型
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  article_count?: number;
}

// 标签类型
export interface Tag {
  id: string;
  name: string;
  slug: string;
  article_count?: number;
}

// 评论类型
export interface Comment {
  id: string;
  content: string;
  author: User;
  article_id: string;
  parent_id?: string;
  reply_count: number;
  like_count: number;
  created_at: string;
  children?: Comment[];
}

// API 响应类型
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  list: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 消息类型
export interface Message {
  id: string;
  type: 'system' | 'comment' | 'like' | 'follow' | 'article';
  title: string;
  content: string;
  is_read: boolean;
  sender?: User;
  target_id?: string;
  target_type?: string;
  created_at: string;
}

// 通知类型
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

// 商品类型
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  image?: string;
  type: 'virtual' | 'physical';
  stock: number;
  sales_count: number;
}

// 订单类型
export interface Order {
  id: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  created_at: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  price: number;
}

// 搜索历史
export interface SearchHistory {
  id: string;
  keyword: string;
  created_at: string;
}

// 导航参数类型
export type RootStackParamList = {
  Main: undefined;
  Article: { id: string };
  Search: undefined;
  Settings: undefined;
  Login: undefined;
  Profile: { userId?: string };
  EditProfile: undefined;
  Notifications: undefined;
  Favorites: undefined;
  History: undefined;
  Coins: undefined;
  Shop: undefined;
  Orders: undefined;
};
