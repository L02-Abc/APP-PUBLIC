import { tabBarTheme, headerTheme } from '@/styles/theme';
import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Animated,
  View,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  TextInput,
  Text,
  Pressable,
  ScrollView,
  Image, FlatList, ActivityIndicator
} from 'react-native';
import { TabView, SceneMap, NavigationState, SceneRendererProps } from 'react-native-tab-view';
import { Ionicons } from '@expo/vector-icons';
import { Icon } from 'react-native-elements';
import { router } from 'expo-router';
import api from '../services/api'
import AsyncStorage from '@react-native-async-storage/async-storage';
import useUserStore from '../store/useUserStore';
import { statusColor } from '@/styles/theme';

// --- TYPE DEFINITIONS ---
type RouteKey = 'all' | 'h1' | 'h2' | 'h3' | 'h6' | 'c';


type Route = {
  key: string;
  title: string;
};

interface BackendPost {
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
}

interface DashboardResponse {
  page: number;
  total: number;
  posts: BackendPost[];
}

type PostItem = {
  id: number;
  title: string;
  building: string;
  imageURL: string;
  post_floor: string;
  nearest_room: string;
  found_at: Date;
  post_des: string;
  user_id: number;
  status: 'open' | 'with-security' | 'returned' | 'pending';
};


function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-based
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}


// --- COMPONENT: SEARCH & FILTER BAR ---
// Tách riêng UI phần Search và Nút Filter để tái sử dụng
const SearchAndFilterBar = ({
  placeholder,
  onFilterTimePress,
  onFilterFloorPress,
}: {
  placeholder: string;
  onFilterTimePress?: () => void;
  onFilterFloorPress?: () => void;
}) => (
  <View style={styles.searchContainer}>
    <View style={styles.searchBar}>
      <Ionicons name="search" size={20} color="#666" style={{ marginRight: 8 }} />
      <TextInput
        placeholder={placeholder}
        style={styles.input}
        placeholderTextColor="#999"
      />
    </View>

    {onFilterTimePress && (
      <TouchableOpacity style={styles.filterBtn} onPress={onFilterTimePress}>
        <Ionicons name="options-outline" size={24} color="white" />
        <Text style={styles.filterText}>Time</Text>
      </TouchableOpacity>
    )}

    {onFilterFloorPress && (
      <TouchableOpacity style={[styles.filterBtn, { marginLeft: 8 }]} onPress={onFilterFloorPress}>
        <Ionicons name="options-outline" size={24} color="white" />
        <Text style={styles.filterText}>Floor</Text>
      </TouchableOpacity>
    )}
  </View>
);

// --- COMPONENT: FILTER DROPDOWN PANEL ---
// Hiển thị danh sách tùy chọn khi bấm nút Filter
const FilterPanel = ({
  title,
  options,
  onClose,
}: {
  title: string;
  options: string[];
  onClose: () => void;
}) => (
  <>
    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
    <View style={styles.filterPanel}>
      <Text style={styles.filterTitle}>{title}</Text>
      {options.map((opt, index) => (
        <TouchableOpacity key={index} style={styles.filterOption} onPress={onClose}>
          <Text>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </>
);

// --- COMPONENT: FOLLOW THREAD BOX ---
const FollowThread = ({ threadId }: { threadId: number }) => {
  const isFollowedStatus = useUserStore(s => s.followedThreadIds.includes(threadId)); // Dung truc tiep de no thay doi
  const toggleThreadFollow = useUserStore(s => s.toggleThreadFollow);

  const handlePress = async () => {
    toggleThreadFollow(threadId);
    const willBeFollowedAfterToggle = useUserStore.getState().isThreadFollowed(threadId);
    try {
      if (willBeFollowedAfterToggle) {
        console.log("Calling Follow API...");
        await api.post('/user/follows', { thread_id: threadId }, {});
      } else {
        // Đang follow -> Gọi API Unfollow
        console.log("Calling Unfollow API...");
        const payload = { thread_id: threadId }
        await api.delete('/user/unfollows',
          payload
        );
      }
    } catch (error) {
      console.error("API Error, rolling back UI:", error);
      // 2. Rollback: Nếu API lỗi, đảo ngược lại trạng thái để khớp với server
      toggleThreadFollow(threadId);
    }
  };

  return (
    <TouchableOpacity style={styles.followBox} onPress={handlePress}>
      <Icon
        name={isFollowedStatus ? 'star' : 'star-outline'}
        type="ionicon"
        color={isFollowedStatus ? '#facc15' : '#000'}
        size={24}
      />
      <Text style={styles.followBoxText}>
        {isFollowedStatus ? 'Following' : 'Follow This Thread'}
      </Text>
    </TouchableOpacity>
  );

};

// Component Card Item
const CardItem = ({ item }: { item: PostItem }) => {
  // Logic chọn màu dựa trên status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return { bg: statusColor.colorsBackground.open, text: statusColor.colorsText.open, label: 'Open' }; // Red
      case 'with-security':
        return { bg: statusColor.colorsBackground.withSecurity, text: statusColor.colorsBackground.withSecurity, label: 'Security' };
      case 'returned':
        return { bg: statusColor.colorsBackground.return, text: statusColor.colorsBackground.return, label: 'Returned' }; // Green
      case 'pending':
        return { bg: statusColor.colorsBackground.pending, text: statusColor.colorsBackground.pending, label: 'Pending' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280', label: status }; // Gray
    }
  };

  const statusStyle = getStatusColor(item.status);

  const handlePress = () => {
    // Điều hướng đến trang chi tiết: /post/123
    router.push(`/post/${item.id}`);
  };

  return (
    <TouchableOpacity style={styles.cartItem} onPress={handlePress} activeOpacity={0.7}>
      {/* Hình ảnh bên trái */}
      <Image
        source={{ uri: item.imageURL || 'https://via.placeholder.com/150' }}
        style={styles.cardImage}
        resizeMode="cover"
      />

      {/* Nội dung ở giữa */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

        <View style={styles.cardMetaRow}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.cardMetaText} numberOfLines={1}>{item.building + ", Tầng " + item.post_floor + ", Phòng " + item.nearest_room}</Text>
        </View>

        <View style={styles.cardMetaRow}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.cardMetaText}>{formatDate(new Date(item.found_at))}</Text>
        </View>
      </View>

      {/* Badge trạng thái ở góc */}
      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
        <Text style={[styles.statusText, { color: statusStyle.text }]}>
          {statusStyle.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const buildingMap: Record<string, number> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h6: 4,
  c: 5,
};


// --- COMPONENT: GENERIC TAB ROUTE ---
// Đây là "khuôn mẫu" chung cho tất cả các Tab.
// Thay vì viết InitRoute, FirstRoute... ta dùng chung cái này.
const GenericTabRoute = ({
  placeholder = "Tìm kiếm...",
  showTimeFilter = true,
  showFloorFilter = true,
  showFollow = true,
  tabName,
}: {
  placeholder?: string;
  showTimeFilter?: boolean;
  showFloorFilter?: boolean;
  showFollow?: boolean;
  tabName: string;
}) => {
  // --- STATE ---
  const [activeFilter, setActiveFilter] = useState<'none' | 'time' | 'floor'>('none');
  const tabId = buildingMap[String(tabName).toLowerCase()];

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [found, setFound] = useState(true);
  // Pagination State
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true); // Initial load
  const [isFetchingMore, setIsFetchingMore] = useState(false); // Loading next page
  const [isRefreshing, setIsRefreshing] = useState(false); // Pull to refresh
  const [hasMore, setHasMore] = useState(true); // Are there more posts?

  const closeFilter = () => setActiveFilter('none');
  const timeOptions = ['All', 'This day', 'This week', 'This month'];
  const floorOptions = ['All Floor', 'Floor B', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5', 'Floor 6', 'Floor 7', 'Floor 8'];

  async function fetchPosts(isArchived: boolean = false, refresh: boolean = false, page: number, limit: number = 10): Promise<DashboardResponse> {
    try {
      let filterBody: any = {};

      if (tabName !== 'All') {
        filterBody.building = tabName; // H1, H2, ...
      }

      const requestPayload = { filters: filterBody }

      console.log('POST /post/dashboard', requestPayload);
      const data = await api.post(`/post/dashboard?archived=${isArchived}&refresh=${refresh}&page=${page}&limit=${limit}`, requestPayload, {});
      return data;
    } catch (error) {
      console.error("Fetch posts error:", error);
      throw error;
    }
  }


  function normalizeStatus(status: string): PostItem['status'] {
    switch (status) {
      case 'OPEN':
        return 'open';
      case 'WITH_SECURITY':
        return 'with-security';
      case 'RETURNED':
        return 'returned';
      default:
        return 'pending';
    }
  }

  const loadData = useCallback(async (refresh = false) => {
    // Prevent duplicate calls
    if (!refresh && (isFetchingMore || !hasMore)) return;

    // Set Loading States
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const targetPage = refresh ? 1 : page;
      const LIMIT = 10;

      const data = await fetchPosts(false, refresh, targetPage, LIMIT);

      const mapped: PostItem[] = data.posts.map((p) => ({
        id: p.id,
        title: p.title,
        building: p.building,
        imageURL: p.images?.[0]?.url ?? '',
        post_floor: p.post_floor,
        nearest_room: p.nearest_room,
        found_at: new Date(p.found_at),
        post_des: p.post_description,
        user_id: p.usr_id,
        status: normalizeStatus(p.post_status),
      }));
      if (mapped.length === 0) {
        console.log("No posts found");
        setFound(false);
      }
      else {
        if (refresh) {
          // REFRESH: Replace list, reset page
          setPosts(mapped);
          setPage(2); // Next page will be 2
          setHasMore(mapped.length >= LIMIT); // If we got fewer than Limit, no more data
        } else {
          // LOAD MORE: Append to list
          setPosts((prev) => [...prev, ...mapped]);
          setPage((prev) => prev + 1);
          setHasMore(mapped.length >= LIMIT);
        }

      }
    } catch (e) {
      console.error("Error loading posts:", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsFetchingMore(false);
    }
  }, [page, hasMore, isFetchingMore, posts.length, tabName]);

  // --- EFFECT: INITIAL LOAD ---
  useEffect(() => {
    loadData(false); // Load page 1 on mount
  }, [tabName]); // Only re-run if tab changes

  // --- FOOTER RENDERER ---
  const renderFooter = () => {
    if (!isFetchingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  };


  return (
    <View style={styles.scene}>
      <SearchAndFilterBar
        placeholder={placeholder}
        onFilterTimePress={showTimeFilter ? () => setActiveFilter(activeFilter === 'time' ? 'none' : 'time') : undefined}
        onFilterFloorPress={showFloorFilter ? () => setActiveFilter(activeFilter === 'floor' ? 'none' : 'floor') : undefined}
      />

      {/* Render Filter Time Panel */}
      {activeFilter === 'time' && (
        <FilterPanel title="Time Options" options={timeOptions} onClose={closeFilter} />
      )}

      {/* Render Filter Floor Panel */}
      {activeFilter === 'floor' && (
        <FilterPanel title="Floor Options" options={floorOptions} onClose={closeFilter} />
      )}

      {showFollow && (
        <FollowThread threadId={tabId} />
      )}
      <View style={styles.contentPlaceholder}>
        {isLoading ? (
          <View className="mt-10 items-center">
            <Text>Đang tải dữ liệu...</Text>
          </View>
        ) : found && posts.length > 0 ? (
          <FlatList
            data={posts}
            style={{ flex: 1, width: '100%' }}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <CardItem item={item} />}
            horizontal={false}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            numColumns={1}
            onEndReached={() => loadData(false)}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
          />
        ) : (
          <View className="mt-10 items-center">
            <Text>Không có dữ liệu</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.8}
          onPress={() => router.push('create/create')}
        >
          <Ionicons name="add" size={22} color="white" />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- MAIN TAB VIEW ---
export default function ScrollableTabView() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);

  // Cấu hình danh sách các Tab ở đây (dễ dàng thêm bớt)
  const [routes] = useState<Route[]>([
    { key: 'all', title: 'All' },
    { key: 'h1', title: 'H1' },
    { key: 'h2', title: 'H2' },
    { key: 'h3', title: 'H3' },
    { key: 'h6', title: 'H6' },
    { key: 'c', title: 'C' },
  ]);

  const renderScene = SceneMap({
    all: () => <GenericTabRoute tabName="All" placeholder="Tìm kiếm chung..." showFloorFilter={false} showFollow={false} />,
    h1: () => <GenericTabRoute tabName="H1" placeholder="Tìm trong H1..." />, // Ví dụ: H1 không cần lọc tầng
    h2: () => <GenericTabRoute tabName="H2" />,
    h3: () => <GenericTabRoute tabName="H3" />,
    h6: () => <GenericTabRoute tabName="H6" />,
    c: () => <GenericTabRoute tabName="C" showFloorFilter={false} />,
  });

  // --- SCROLLABLE TAB BAR RENDERER ---
  const renderTabBar = (
    props: SceneRendererProps & { navigationState: NavigationState<Route> }
  ) => {
    const inputRange = props.navigationState.routes.map((x, i) => i);

    return (
      <View style={styles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {props.navigationState.routes.map((route, i) => {
            // Tính toán opacity dựa trên vị trí scroll (tương đối
            // Ở đây ta dùng cách đơn giản: Kiểm tra index hiện tại để highlight.
            const isFocused = index === i;
            const opacity = isFocused ? 1 : 0.6;

            return (
              <TouchableOpacity
                key={route.key}
                style={styles.tabItem}
                onPress={() => setIndex(i)}
              >
                <Text style={[styles.tabLabel, { opacity }]}>
                  {route.title}
                </Text>
                {/* Indicator đơn giản dưới mỗi tab đang active */}
                {isFocused && <View style={styles.indicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        lazy // Chỉ render tab khi người dùng bấm vào (tối ưu hiệu năng)
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scene: {
    flex: 1,
    backgroundColor: '#eef2ff',
  },
  contentPlaceholder: {
    flex: 1,
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },

  // --- Styles: Tab Bar (Scrollable) ---
  tabBarContainer: {
    backgroundColor: headerTheme.colors.primary,
    height: 48, // Chiều cao cố định
  },
  scrollContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabItem: {
    paddingHorizontal: 16, // Khoảng cách ngang giữa chữ và viền
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minWidth: 70, // Chiều rộng tối thiểu để dễ bấm
  },
  tabLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '80%', // Indicator dài bằng 80% chữ
    backgroundColor: 'white',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  // --- Styles: Search & Filter ---
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: headerTheme.colors.primary,
    zIndex: 10, // Đảm bảo dropdown đè lên nội dung dưới
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    alignItems: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  filterBtn: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
  },

  // --- Styles: Dropdown Panel ---
  filterPanel: {
    position: 'absolute',
    right: 15,
    width: '43%',
    top: 60, // Cách đỉnh scene 1 chút (dưới thanh search)
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    minWidth: 150,
    zIndex: 20, // Cao hơn search bar
    // Shadow
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  filterTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 4,
  },
  filterOption: {
    paddingVertical: 8,
  },

  //style follow box
  followBox: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#cce2cdff',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    borderRadius: 8,
  },
  followBoxText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },

  //style card item

  cardImagePlaceholder: {
    height: '90%',
    width: 30,
  },
  cartItem: {

    backgroundColor: 'white',
    borderRadius: 12,
    flexDirection: 'row', // Xếp ngang
    padding: 12,
    marginBottom: 12, // Khoảng cách giữa các card
    // Shadow
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardImage: {
    width: 90,
    height: 100,
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
    //marginRight: 40,
    width: '70%',
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


  // Create Button
  createButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  createButtonText: {
    marginLeft: 6,
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});