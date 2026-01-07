
import React, { useState, useEffect, useCallback } from 'react';
import { Stack, router } from 'expo-router';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker'; // Standard Expo/RN picker
import api from '../services/api'; // Import your API wrapper
import { headerTheme } from 'styles/theme';
import { Report, ReportListSchema } from '@/schema/report'
import * as Sentry from '@sentry/react-native';
import CustomDateTimePicker from '@/schema/datetimepicker'
// --- Types ---
interface User {
    id: number;
    username: string;
    avatar_url?: string;
}


export default function AdminReportsScreen() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const [endDate, setEndDate] = useState(new Date());

    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('start_date', startDate.toISOString());
            formData.append('end_date', endDate.toISOString());

            const response = await api.post('/others/reports', formData, { isFormData: true });
            console.log(response);
            setReports(response);
        } catch (error: any) {
            Sentry.captureException(error)
            Alert.alert("Error", error.message || "Failed to fetch reports");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Initial Load
    useEffect(() => {
        fetchReports();
    }, []);

    // --- Render Helpers ---
    const renderItem = ({ item }: { item: Report }) => {
        // Helper to color-code the status
        const getStatusColor = (status: string) => {
            switch (status.toUpperCase()) {
                case 'UNRESOLVED': return '#D32F2F'; // Red
                case 'RESOLVED': return '#388E3C'; // Green
                case 'PENDING': return '#FBC02D'; // Yellow
                default: return '#757575'; // Grey
            }
        };

        return (
            <View style={styles.card}>
                {/* Header: Reporter Name & Date */}
                <View style={styles.cardHeader}>
                    <Text style={styles.reporterName}>
                        Người báo cáo: <Text style={styles.bold}>{item.user.alias}</Text>
                    </Text>
                    <Text style={styles.date}>
                        {new Date(item.time_created).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>

                {/* Main Title (The Reason) */}
                <Text style={styles.reasonLabel}>Lý do:</Text>
                <Text style={styles.reasonText}>{item.title}</Text>

                {/* Detailed Message */}
                <View style={styles.messageBox}>
                    <Text style={styles.descText}>"{item.report_message}"</Text>
                </View>

                {/* Footer: Status Badge */}
                <View style={styles.footer}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.report_status) }]}>
                        <Text style={styles.statusText}>{item.report_status}</Text>
                    </View>

                    <Text style={styles.idText}>{item.post_id ? "ID Post" : "ID Claim"}: {item.post_id ? item.post_id : item.claim_id}</Text>
                </View>
            </View>
        );
    };


    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerTitle: 'Thống kê',
                    headerBackVisible: true,
                    headerTitleAlign: 'center',
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
            {/* --- Filter Section --- */}
            <View style={styles.filterContainer}>
                <Text style={styles.headerTitle}>Quản lý báo cáo</Text>

                <View style={styles.dateRow}>
                    <Text style={styles.content}>Thời gian bắt đầu</Text>
                    <CustomDateTimePicker
                        date={startDate}
                        onDateChange={setStartDate}
                        label="Chọn thời gian bắt đầu"
                    />

                    <Text style={styles.content}>Thời gian kết thúc</Text>
                    <CustomDateTimePicker
                        date={endDate}
                        onDateChange={setEndDate}
                        label="Chọn thời gian kết thúc"
                    />
                </View>

                <TouchableOpacity style={styles.searchBtn} onPress={fetchReports}>
                    <Text style={styles.searchBtnText}>Xác nhận lọc</Text>
                </TouchableOpacity>
            </View>



            {/* --- List Section --- */}
            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={reports}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReports(); }} />
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No reports found in this range.</Text>
                    }
                />
            )}
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    filterContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    content: {
        fontSize: 15,
        marginBottom: 12,
        marginTop: 12,
        color: '#333',
    },
    dateRow: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    dateButton: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    dateLabel: {
        fontSize: 14,
        color: '#333',
    },
    searchBtn: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    searchBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        // Shadows
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingBottom: 8,
    },
    reporterName: {
        fontSize: 14,
        color: '#555',
    },
    bold: {
        fontWeight: '600',
        color: '#333',
    },
    date: {
        color: '#999',
        fontSize: 12,
    },
    reasonLabel: {
        fontSize: 12,
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    reasonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    messageBox: {
        backgroundColor: '#F9FAFB',
        padding: 10,
        borderRadius: 8,
        marginVertical: 6,
    },
    descText: {
        fontSize: 14,
        color: '#4B5563',
        fontStyle: 'italic',
        lineHeight: 20,
    },
    footer: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    idText: {
        color: '#ccc',
        fontSize: 10,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
    }
});