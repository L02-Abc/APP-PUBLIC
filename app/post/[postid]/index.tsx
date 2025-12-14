import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar, Alert
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { headerTheme } from '../../../styles/theme'; // Đảm bảo đường dẫn đúng
import api from '../../services/api'
import { statusColor } from '@/styles/theme';
import useUserStore from '@/app/store/useUserStore';
import { useFocusEffect } from "@react-navigation/native";


type PostDetailType = {
  id: number;
  title: string;
  building: string;
  post_floor: string;
  nearest_room: string;
  found_at: string;        // JSON string from backend
  post_description: string;
  post_status: string;     // "OPEN", "RETURNED", ...
  usr_id: number;
  images: { url: string }[];
};

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-based
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export default function PostDetail() {
  // 1. Lấy ID từ URL
  const { postid } = useLocalSearchParams();
  const [post, setPost] = useState<PostDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPostCreator, setCreator] = useState(false);

  const [isSubmitClaim, setSubmitClaim] = useState(true);
  const currentUserID = useUserStore(s => s.id);
  const [alias, setAlias] = useState<string | null>(null);

  async function fetchPost(postid: number): Promise<PostDetailType> {
    const dataFetch = await api.get(`/post/get-post-details/${postid}`);
    return dataFetch as PostDetailType;
  }

  const refreshPost = async () => {
    await submitClaim();
  };

  const loadPost = async () => {
    const response = await fetchPost(Number(postid));
    setPost(response);
    if (response?.usr_id === currentUserID) {
      setCreator(true);
    } else {
      setCreator(false);
    }
  };
  const submitClaim = async () => {
    const res = await api.get(`/post/${postid}/claims/me`)
    if (res == null) {
      setSubmitClaim(false)
    }
  }

  const getInfo = async () => {
    const res = await api.post('/user/infoById', { id: currentUserID }, {});
    setAlias(res.alias);
  }
  useFocusEffect(
    useCallback(() => {
      getInfo();
      submitClaim();
      loadPost().finally(() => setIsLoading(false));
    }, [postid])
  );


  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Không tìm thấy bài viết.</Text>
      </View>
    );
  }

  // Helper render Status Badge
  const renderStatusBadge = (status?: string) => {
    const s = status?.toLowerCase();

    const map: Record<string, { bg: string; color: string; text: string }> = {
      open: {
        bg: statusColor.colorsBackground.open,
        color: statusColor.colorsText.open,
        text: 'Đang tìm chủ nhân',
      },
      'with-security': {
        bg: statusColor.colorsBackground.withSecurity,
        color: statusColor.colorsText.withSecurity,
        text: 'Đã gửi bảo vệ',
      },
      archived: {
        bg: statusColor.colorsBackground.return,
        color: statusColor.colorsText.return,
        text: 'Đã có người nhận',
      },
      pending: {
        bg: statusColor.colorsBackground.pending,
        color: statusColor.colorsText.pending,
        text: 'Đang xử lý',
      },
    };

    const cfg = map[s ?? ''];

    if (!cfg) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#f3f4f6' }]}>
          <Text style={[styles.statusText, { color: '#6b7280' }]}>
            Không xác định
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.statusText, { color: cfg.color }]}>
          {cfg.text}
        </Text>
      </View>
    );
  };


  const handleDelete = () => {
    Alert.alert(
      "Gỡ bài viết",
      "Bạn có chắc muốn xóa bài viết này không?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await api.patch(`/post/soft-delete-post/${postid}`, {}, {});
              console.log("Deleted!");
              router.back();
            } catch (err) {
              console.log("Error deleting post", err);
              Alert.alert("Lỗi", "Không thể xóa bài viết.");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Cấu hình Header cho trang này */}
      <Stack.Screen
        options={{
          headerTitle: 'Chi tiết bài đăng',
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

      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.imageContainer}>
          <Image source={{ uri: post.images?.[0]?.url ?? '' }} style={styles.image} resizeMode="cover" />
        </View>

        <View style={styles.body}>
          {/* 2. HEADER INFO */}
          <View style={styles.headerInfo}>
            {renderStatusBadge(post.post_status.toLowerCase())}
            <Text style={styles.date}>{formatDate(new Date(post.found_at))}</Text>
          </View>

          <Text style={styles.title}>{post.title}</Text>

          {/* 3. LOCATION CARDS (Grid Layout) */}
          <View style={styles.locationGrid}>
            <View style={styles.locationItem}>
              <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="business-outline" size={20} color="#0284c7" />
              </View>
              <View>
                <Text style={styles.locationLabel}>Tòa nhà</Text>
                <Text style={styles.locationValue}>{post.building}</Text>
              </View>
            </View>

            <View style={styles.locationItem}>
              <View style={[styles.iconBox, { backgroundColor: '#fce7f3' }]}>
                <Ionicons name="layers-outline" size={20} color="#db2777" />
              </View>
              <View>
                <Text style={styles.locationLabel}>Tầng</Text>
                <Text style={styles.locationValue}>{post.post_floor}</Text>
              </View>
            </View>

            <View style={styles.locationItem}>
              <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="location-outline" size={20} color="#16a34a" />
              </View>
              <View>
                <Text style={styles.locationLabel}>Gần phòng</Text>
                <Text style={styles.locationValue}>{post.nearest_room}</Text>
              </View>
            </View>
          </View>

          {/* 4. DESCRIPTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
            <Text style={styles.descriptionText}>{post.post_description}</Text>
          </View>


          <View style={styles.userSection}>
            <Text style={styles.sectionTitle}>Người đăng</Text>
            <View style={styles.userCard}>

              <View style={styles.userInfo}>
                <Text style={styles.userName}>{alias}</Text>
                {/* <Text style={styles.userRole}>Sinh viên</Text> */}
              </View>
              {/* <TouchableOpacity style={styles.messageBtn}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color="#2563EB" />
              </TouchableOpacity> */}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 6. BOTTOM ACTION BAR (Sticky Footer) */}
      {isPostCreator ? (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.secondaryBtn, post.post_status != "OPEN" ? { opacity: 0.5 } : null]} onPress={handleDelete} disabled={post.post_status != "OPEN"}>
            <Text style={styles.secondaryBtnText}>Gỡ bỏ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.editBtn, post.post_status != "OPEN" ? { opacity: 0.5 } : null]} disabled={post.post_status != "OPEN"} onPress={() => router.push({
            pathname: `/post/${postid}/change_post`,
            params: { titleP: post.title, buildingP: post.building, post_floorP: post.post_floor, nearest_roomP: post.nearest_room, found_atP: post.found_at, post_descriptionP: post.post_description, imageP: post.images?.[0]?.url ?? "", }

          },)}>
            <Text style={styles.editBtnText}>Sửa</Text>
          </TouchableOpacity>


          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push((`/post/${postid}/view_claim`))}>
            <Text style={styles.primaryBtnText}>Xem yêu cầu nhận</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push(`/post/${postid}/report`)}>
            <Text style={styles.secondaryBtnText}>Báo cáo</Text>
          </TouchableOpacity>
          {isSubmitClaim ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push({ pathname: `/post/${postid}/my_claim` })}>
              <Text style={styles.primaryBtnText}>Xem yêu cầu của bạn</Text>
            </TouchableOpacity>
          ) : (

            <TouchableOpacity style={[styles.primaryBtn, post.post_status != 'OPEN' ? { opacity: 0.7 } : null]}

              onPress={() => router.push(`/post/${postid}/submit_claim`)}
              disabled={post.post_status != 'OPEN'}>
              <Text style={styles.primaryBtnText}>Liên hệ nhận đồ</Text>
            </TouchableOpacity>
          )}

        </View>
      )}



    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100, // Để chừa chỗ cho footer
  },

  // Image
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#eee',
  },
  image: {
    width: '100%',
    height: '100%',
  },

  // Body
  body: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, // Bo tròn góc nối với ảnh cho đẹp
    borderTopRightRadius: 24,
    marginTop: -20, // Kéo lên đè lên ảnh một chút
  },

  // Header Info
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  date: {
    color: '#9ca3af',
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    lineHeight: 30,
  },

  // Location Grid
  locationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  locationItem: {
    alignItems: 'center',
    flex: 1, // Chia đều không gian
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
  },

  // User Section
  userSection: {
    marginBottom: 24,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    borderRadius: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  userRole: {
    fontSize: 13,
    color: '#6b7280',
  },
  messageBtn: {
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    // Shadow cho đẹp
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fdd7d7ff',
    marginRight: 12,
  },
  secondaryBtnText: {
    color: '#fc1f1fff',
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#e0e7ff', // light indigo
    marginRight: 12,
  },
  editBtnText: {
    color: '#4338ca', // indigo text
    fontWeight: '600',
  },

});