import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { headerTheme } from 'styles/theme'
type PostItem = {
  id: number;
  title: string;
  building: string;
  images: string;
  post_floor: string;
  nearest_room: string;
  found_at: Date;
  post_description: string;
  user_id: number;
  thread_id: number;
  post_status: string;
};

// Hàm format ngày tháng
function formatDate(date: Date): string {
  if (isNaN(date.getTime())) return 'N/A';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

const CardItem = ({ item }: { item: PostItem }) => {
  const getStatusColor = (status: string) => {
    const s = status ? status.toLowerCase() : 'open';
    switch (s) {
      case 'open': return { bg: '#fee2e2', text: '#ef4444', label: 'Open' };
      case 'with-security': return { bg: '#fef3c7', text: '#d97706', label: 'Security' }; // Chỉnh lại màu text cho dễ nhìn
      case 'archived': return { bg: '#dcfce7', text: '#22c55e', label: 'Returned' };
      default: return { bg: '#f3f4f6', text: '#6b7280', label: status };
    }
  };

  const statusStyle = getStatusColor(item.post_status);

  return (
    <TouchableOpacity
      style={styles.cardItem}
      activeOpacity={0.7}
      onPress={() => router.push(`/post/${item.id}`)}
    >
      <Image
        source={{ uri: item.images || 'https://via.placeholder.com/150' }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title || 'Không có tiêu đề'}</Text>
        <View style={styles.cardMetaRow}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {item.building} {item.post_floor ? `- Tầng ${item.post_floor}` : ''}
          </Text>
        </View>
        <View style={styles.cardMetaRow}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.cardMetaText}>{formatDate(item.found_at)}</Text>
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
        <Text style={[styles.statusText, { color: statusStyle.text }]}>
          {statusStyle.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// --- MAIN SCREEN ---
export default function MyPostsScreen() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Fetch bài viết khi đã có userId
  useEffect(() => {
    const fetchMyPosts = async () => {
      setIsLoading(true);
      try {

        const data: any = await api.get('/user/me/posts');

        if (data) {
          const mapped: PostItem[] = data.map((p: any) => ({
            id: p.id ?? 0,
            title: p.title,
            building: p.building,
            images: p.images?.[0]?.url ?? '',
            post_floor: p.post_floor,
            nearest_room: p.nearest_room,
            found_at: new Date(p.found_at),
            post_des: p.post_description,
            user_id: p.usr_id,
            post_status: p.post_status ? p.post_status.toLowerCase() : 'open',
          }));
          setPosts(mapped);
        }
      } catch (error) {
        console.error("Lỗi tải bài viết của tôi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyPosts();
  }, []);

  return (
    <View style={styles.container}>
      {/* Cấu hình Header */}
      <Stack.Screen
        options={{
          headerTitle: 'Bài viết của tôi',
          headerBackVisible: true,
          headerBackTitle: 'Quay lại',
          headerTintColor: '#333',
          headerStyle: { backgroundColor: headerTheme.colors.primary },
          headerTitleStyle: {
            fontFamily: "Inter-Bold",
            fontSize: 20,
            fontWeight: "700",
            color: "#111827",
          },
        }}
      />

      <View style={styles.content}>
        {/* Loading State */}
        {isLoading && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Đang tải bài viết...</Text>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && posts.length === 0 && (
          <View style={styles.centerBox}>
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>Bạn chưa đăng bài viết nào.</Text>
            <TouchableOpacity
              style={styles.createNowBtn}
              onPress={() => router.push('/(tabs)/create')}
            >
              <Text style={styles.createNowText}>Đăng bài ngay</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List Data */}
        {!isLoading && posts.length > 0 && (
          <FlatList
            data={posts}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <CardItem item={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // Màu nền xám nhẹ
  },
  content: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 20,
  },
  listContent: {
    padding: 16,
  },

  // Nút tạo bài viết khi danh sách trống
  createNowBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  createNowText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Style cho Card Item (Giống trang chủ)
  cardItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    // Shadow
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 22,
    width: '95%',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardMetaText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    flex: 1,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});