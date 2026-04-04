import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useInfiniteQuery } from 'react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { articleApi } from '../api/articleApi';
import { Article } from '../types';

const { width } = Dimensions.get('window');

export default function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = React.useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery(
    'articles',
    ({ pageParam = 1 }) => articleApi.getArticles({ page: pageParam, limit: 10 }),
    {
      getNextPageParam: (lastPage, pages) => {
        if (lastPage.articles.length < 10) return undefined;
        return pages.length + 1;
      },
    }
  );

  const articles = data?.pages.flatMap(page => page.articles) || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderArticle = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={styles.articleCard}
      onPress={() => navigation.navigate('Article', { id: item.id })}
    >
      {item.cover_image && (
        <Image source={{ uri: item.cover_image }} style={styles.articleImage} />
      )}
      <View style={styles.articleContent}>
        <Text style={styles.articleTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.articleSummary} numberOfLines={2}>
          {item.summary}
        </Text>
        <View style={styles.articleMeta}>
          <View style={styles.metaItem}>
            <Icon name="eye" size={14} color="#999" />
            <Text style={styles.metaText}>{item.view_count}</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="heart" size={14} color="#999" />
            <Text style={styles.metaText}>{item.like_count}</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="comment" size={14} color="#999" />
            <Text style={styles.metaText}>{item.comment_count}</Text>
          </View>
          <Text style={styles.articleDate}>
            {new Date(item.created_at).toLocaleDateString('zh-CN')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Hakimi 的博客</Text>
      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => navigation.navigate('Search')}
      >
        <Icon name="magnify" size={24} color="#667eea" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          isFetchingNextPage ? (
            <View style={styles.loadingMore}>
              <Text style={styles.loadingText}>加载中...</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchButton: {
    padding: 8,
  },
  list: {
    padding: 16,
  },
  articleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  articleImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  articleContent: {
    padding: 16,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  articleSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  articleDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
  },
});
