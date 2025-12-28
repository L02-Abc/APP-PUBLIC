import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,

} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../services/api';
import { headerTheme } from 'styles/theme'

// Danh sách các lý do báo cáo có sẵn
const REPORT_REASONS = [
    'Spam hoặc scam',
    'Nội dung không phù hợp',
    'Thông tin sai lệch',
    'Ngôn từ xúc phạm/không phù hợp',
    'Khác' // Tùy chọn này sẽ mở ra ô nhập liệu title tùy chỉnh
];

export default function ReportScreenClaim() {
    const { postid, claimid } = useLocalSearchParams();
    const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
    const [customTitle, setCustomTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reported, setReported] = useState(false);
    const handleSubmit = async () => {
        // 1. Xác định Title cuối cùng
        const finalTitle = selectedReason === 'Khác' ? customTitle.trim() : selectedReason;

        // 2. Validate
        if (!finalTitle) {
            Alert.alert('Thiếu thông tin', 'Hãy điền lý do báo cáo.');
            return;
        }


        setIsSubmitting(true);

        try {
            const claimIdStr = Array.isArray(claimid) ? claimid[0] : claimid;

            const payload = {
                title: finalTitle,
                report_message: message ? message : "No data",
                post_id: postid,
                claim_id: claimIdStr
            };

            // 3. Gọi API gửi báo cáo
            // Endpoint giả định: POST /posts/{id}/report
            await api.post(`/others/report/send-report`, payload, {});

            Alert.alert(
                'Báo cáo đã gửi thành công',
                'Cảm ơn bạn vì đẫ giúp cộng đồng văn minh hơn. Chúng tôi sẽ xem xét báo cáo của bạn nhanh nhất có thể!',
                [
                    { text: 'OK', onPress: () => router.back() }
                ]
            );
        } catch (error: any) {
            console.error(error);
            const msg = error.message || 'Lỗi khi gửi báo cáo. Hãy thử lại sau';
            Alert.alert('Error', msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerTitle: 'Báo cáo yêu cầu nhận',
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

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    <View style={styles.infoBox}>
                        <Ionicons name="shield-checkmark-outline" size={24} color="#2563EB" />
                        <Text style={styles.infoText}>
                            Báo cáo của bạn là hoàn toàn ẩn danh. Hãy chọn các lý do báo cáo với bài đăng này ở dưới
                        </Text>
                    </View>

                    {/* Section: Select Title/Reason */}
                    <Text style={styles.sectionTitle}>What is the problem?</Text>
                    <View style={styles.optionsContainer}>
                        {REPORT_REASONS.map((reason) => (
                            <TouchableOpacity
                                key={reason}
                                style={[
                                    styles.optionBtn,
                                    selectedReason === reason && styles.optionBtnSelected
                                ]}
                                onPress={() => setSelectedReason(reason)}
                            >
                                <Text style={[
                                    styles.optionText,
                                    selectedReason === reason && styles.optionTextSelected
                                ]}>
                                    {reason}
                                </Text>
                                {selectedReason === reason && (
                                    <Ionicons name="radio-button-on" size={20} color="#2563EB" />
                                )}
                                {selectedReason !== reason && (
                                    <Ionicons name="radio-button-off" size={20} color="#9ca3af" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Section: Custom Title Input (If "Other" selected) */}
                    {selectedReason === 'Khác' && (
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Hãy nêu cụ thể hơn về vi phạm này <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nêu thông tin cụ thể ở đây"
                                placeholderTextColor="#9ca3af"
                                value={customTitle}
                                onChangeText={setCustomTitle}
                            />
                        </View>
                    )}

                    {/* Section: Message/Description */}
                    {selectedReason !== 'Khác' && <View style={styles.formGroup}>
                        <Text style={styles.label}>Cung cấp thêm thông tin về vi phạm này</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Thông tin cụ thể hơn về vi phạm"
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                            value={message}
                            onChangeText={setMessage}
                        />
                    </View>}

                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>Gửi</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#eff6ff', // Light blue background
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        color: '#1e40af',
        fontSize: 14,
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
    },
    optionsContainer: {
        marginBottom: 24,
    },
    optionBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    optionBtnSelected: {
        backgroundColor: '#eff6ff',
        borderColor: '#2563EB',
    },
    optionText: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    optionTextSelected: {
        color: '#2563EB',
        fontWeight: '600',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    required: {
        color: '#ef4444',
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#1f2937',
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        backgroundColor: '#fff',
    },
    submitBtn: {
        backgroundColor: '#dc2626', // Red color for report action usually implies caution/alert
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitBtnDisabled: {
        backgroundColor: '#fca5a5',
        shadowOpacity: 0,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});