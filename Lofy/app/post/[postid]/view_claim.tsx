import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api'; // Hãy kiểm tra lại đường dẫn import api của bạn

// Định nghĩa kiểu dữ liệu Claim
interface Claim {
  id: number;
  post_id: number;
  usr_id: number;
  claim_description: string;
  contact_info: string;
  updated_at: string;
  user_name?: string;
  status?: string; // Thêm status để hiển thị màu sắc nếu cần
}

interface UserName {
  alias: string;
  email: string;
}

// --- TÁCH COMPONENT CON: ClaimCard ---
// Component này chịu trách nhiệm hiển thị từng item và fetch tên user riêng lẻ
const ClaimCard = ({ 
  item, 
  onValidate, 
  onReport 
}: { 
  item: Claim; 
  onValidate: (id: number, decision: 'accepted' | 'rejected') => void; 
  onReport: (id: number) => void;
}) => {
  const [userName, setUserName] = useState<UserName | null>(null);
  const [loadingName, setLoadingName] = useState(true);

  let statusBg = '#f3f4f6';

  useEffect(() => {
    let isMounted = true;

    const fetchName = async () => {
      try {
        const res = await api.post(`/user/infoById`,{id: Number(item.usr_id)} , {}); 
        
        if (isMounted) {
          setUserName(res as UserName); // api wrapper của bạn trả về data trực tiếp
        }
      } catch (err) {
        console.error("Error fetching user name:", err);
      } finally {
        if (isMounted) setLoadingName(false); 
      }
    };
    
    fetchName();

    return () => { isMounted = false; };
  }, [item.usr_id]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.claimId}>Yêu cầu #{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={styles.statusText}>
            {loadingName ? "Đang tải..." : (userName ? userName.alias : "Unknown")}
          </Text>
        </View>
      </View>

      <Text style={styles.date}>
        {new Date(item.updated_at).toLocaleString('vi-VN')}
      </Text>
      
      <Text style={styles.sectionHeader}>Nội dung</Text>
      <View style={styles.descriptionBox}>
        <Text style={styles.description}>{item.claim_description}</Text>
      </View>
      
      <Text style={styles.sectionHeader}>Thông tin liên hệ</Text>
      <View style={styles.descriptionBox}>
        <Text style={styles.description}>{item.contact_info}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnAccept]}
          onPress={() => onValidate(item.id, 'accepted')}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="white" />
          <Text style={styles.btnText}>Chấp nhận</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnReject]}
          onPress={() => onValidate(item.id, 'rejected')}
        >
          <Ionicons name="close-circle-outline" size={20} color="white" />
          <Text style={styles.btnText}>Từ chối</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnReport]}
          onPress={() => onReport(item.id)}
        >
          <Ionicons name="flag-outline" size={20} color="#ca8a04" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- COMPONENT CHÍNH ---
export default function ClaimsScreen() {
  const { postid } = useLocalSearchParams();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  // Format Post ID an toàn
  const postIdStr = Array.isArray(postid) ? postid[0] : postid;

  const fetchClaims = async () => {
    if (!postIdStr) return;
    try {
      setLoading(true);
      const data = await api.get(`/post/${postIdStr}/claims`);
      setClaims(data);
    } catch (err: any) {
      console.error("Fetch claims error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [postIdStr]);

  const handleValidateClaim = async (claimId: number, decision: 'accepted' | 'rejected') => {
    try {
      await api.patch(`/post/${claimId}/validate-claim?post_id=${postid}&decision=${decision}`, {});
      Alert.alert('Thành công', `Đã ${decision === 'accepted' ? 'chấp nhận' : 'từ chối'} yêu cầu.`);
      // Reload lại danh sách sau khi update
      fetchClaims();
    } catch (err: any) {
      Alert.alert('Thất bại', err.message || 'Có lỗi xảy ra khi xử lý yêu cầu.');
    }
  };

  const handleReportClaim = (claimId: number) => {
    Alert.alert(
      "Báo cáo vi phạm",
      "Bạn có chắc muốn báo cáo yêu cầu nhận đồ này không?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Báo cáo", style: "destructive", onPress: () => console.log(`Report claim ${claimId}`) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: `Yêu cầu nhận đồ (#${postIdStr})` }} />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={{ marginTop: 10, color: '#666' }}>Đang tải danh sách...</Text>
        </View>
      ) : (
        <FlatList
          data={claims}
          keyExtractor={(item) => item.id.toString()}
          // Sử dụng Component con đã tách ra để render
          renderItem={({ item }) => (
            <ClaimCard 
              item={item} 
              onValidate={handleValidateClaim} 
              onReport={handleReportClaim} 
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="file-tray-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>Chưa có yêu cầu nhận đồ nào.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  listContent: {
    padding: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  claimId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },
  sectionHeader: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    marginTop: 4,
  },
  descriptionBox: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8, // Chỉ hoạt động trên React Native mới, nếu lỗi dùng marginRight ở btn
    marginTop: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  btnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  btnAccept: {
    backgroundColor: '#22c55e', // Green
  },
  btnReject: {
    backgroundColor: '#ef4444', // Red
  },
  btnReport: {
    backgroundColor: '#fef9c3', // Yellow light
    flex: 0.3, // Nút report nhỏ hơn
    borderWidth: 1,
    borderColor: '#facc15',
    alignItems: 'center', 
    justifyContent: 'center'
  },
});