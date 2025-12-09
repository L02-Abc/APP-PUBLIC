import React, { useEffect, useState } from 'react';
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
    SafeAreaView
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api'; // Đảm bảo đường dẫn này đúng với cấu trúc của bạn


type Claim = {
    post_id: number,
    claim_description: string,
    contact_info: string,
}

export default function SubmitClaimScreen() {
    const { postid } = useLocalSearchParams();
    const [description, setDescription] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const getMyClaim = async (): Promise<Claim> => {
        const res = await api.get(`/post/${postid}/claims/me`)
        return res as Claim;
    }

    useEffect(() => {
        const fetchClaim = async () => {
            try {
                const data = await getMyClaim();   // 👈 await the promise
                if (data) {
                    setDescription(data.claim_description);
                    setContactInfo(data.contact_info);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchClaim();
    }, [])
    // Xử lý logic gửi yêu cầu
    const handleUpdate = async () => {
        // 1. Validate dữ liệu

        if (!description.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập mô tả chi tiết để chứng minh bạn là chủ sở hữu.');
            return;
        }
        if (!contactInfo.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập thông tin liên hệ (SĐT, Zalo, Email...).');
            return;
        }

        setIsUpdating(true);

        try {
            // 2. Chuẩn bị payload
            const payload = {
                post_id: postid,
                claim_description: description,
                contact_info: contactInfo,
            };

            // 3. Gọi API (Endpoint giả định dựa trên context cũ: POST /posts/{id}/claims)
            const postIdStr = Array.isArray(postid) ? postid[0] : postid;
            await api.patch(`/post/${postIdStr}/update-claim`, payload);

            // 4. Thành công
            Alert.alert(
                'Thành công',
                'Đã cập nhật thành công yêu cầu của bạn.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back(), // Quay lại trang chi tiết
                    },
                ]
            );
        } catch (error: any) {
            console.error(error);
            const message = error.message || 'Có lỗi xảy ra khi gửi yêu cầu.';
            Alert.alert('Lỗi', message);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Config Header */}
            <Stack.Screen
                options={{
                    headerTitle: 'Gửi yêu cầu nhận đồ',
                    //headerBackTitleVisible: false,
                    headerTintColor: '#333',
                }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    {/* Hướng dẫn */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={24} color="#2563EB" />
                        <Text style={styles.infoText}>
                            Hãy mô tả chi tiết đặc điểm của món đồ (màu sắc, nhãn hiệu, vết trầy xước, đồ bên trong...) để người nhặt có thể xác minh và phản hồi tới bạn.
                        </Text>
                    </View>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={24} color="#2563EB" />
                        <Text style={styles.infoText}>
                            Các thông tin mà bạn nhập sẽ chỉ hiển thị với người đăng bài
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Mô tả chi tiết <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Ví dụ: Ví màu nâu, nhãn hàng B, bên trong có thẻ sinh viên tên Nguyễn Văn A..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Thông tin liên hệ <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Số điện thoại, Zalo hoặc Email..."
                            placeholderTextColor="#9ca3af"
                            value={contactInfo}
                            onChangeText={setContactInfo}
                        />

                    </View>

                </ScrollView>

                {/* Footer Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.submitBtn, isUpdating && styles.submitBtnDisabled]}
                        onPress={handleUpdate}
                        disabled={isUpdating}
                    >
                        {isUpdating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>Cập nhật yêu cầu</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
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
        backgroundColor: '#eff6ff',
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
        minHeight: 200,
        paddingTop: 12,
    },
    helperText: {
        marginTop: 6,
        fontSize: 13,
        color: '#80806bff',
    },

    // Footer
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        backgroundColor: '#fff',
    },
    submitBtn: {
        backgroundColor: '#2563EB',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitBtnDisabled: {
        backgroundColor: '#93c5fd',
        shadowOpacity: 0,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});