// app/post/create.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    FlatList
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { headerTheme } from 'styles/theme'
import CustomDateTimePicker from 'schema/datetimepicker';
import api from '../../services/api';

const buildingMap: Record<string, number> = {
    h1: 1,
    h2: 2,
    h3: 3,
    h6: 4,
    c: 4,
};

const BUILDINGS = [
    { label: 'Tòa nhà H1', value: 'H1' },
    { label: 'Tòa nhà H2', value: 'H2' },
    { label: 'Tòa nhà H3', value: 'H3' },
    { label: 'Tòa nhà H6', value: 'H6' },
    { label: 'Nhà thi đấu', value: 'C' },
];

const FLOORS = [
    { label: 'Tầng 1', value: '1' },
    { label: 'Tầng 2', value: '2' },
    { label: 'Tầng 3', value: '3' },
    { label: 'Tầng 4', value: '4' },
    { label: 'Tầng 5', value: '5' },
    { label: 'Tầng 6', value: '6' },
    { label: 'Tầng 7', value: '7' },
    { label: 'Tầng 8', value: '8' },
    { label: 'Tầng B', value: 'B' },
];



function CustomPicker({
    label,
    value,
    items,
    onValueChange,
    placeholder
}: {
    label: string;
    value: string;
    items: Array<{ label: string; value: string }>;
    onValueChange: (value: string) => void;
    placeholder: string;
}) {
    const [visible, setVisible] = useState(false);
    const selectedLabel = items.find(item => item.value === value)?.label || placeholder;

    return (
        <>
            <TouchableOpacity
                style={styles.input}
                onPress={() => setVisible(true)}
            >
                <Text style={{ color: value ? '#111827' : '#9ca3af', fontSize: 14 }}>
                    {selectedLabel}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <Modal
                visible={visible}
                transparent
                animationType="slide"
                onRequestClose={() => setVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <TouchableOpacity onPress={() => setVisible(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={items}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalItem,
                                        value === item.value && styles.modalItemSelected
                                    ]}
                                    onPress={() => {
                                        onValueChange(item.value);
                                        setVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.modalItemText,
                                        value === item.value && styles.modalItemTextSelected
                                    ]}>
                                        {item.label}
                                    </Text>
                                    {value === item.value && (
                                        <Ionicons name="checkmark" size={20} color="#2563EB" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}


function normalizeParams<T extends Record<string, string | string[] | undefined>>(params: T) {
    const normalized: Record<string, string> = {};
    for (const key in params) {
        const value = params[key];
        if (Array.isArray(value)) {
            normalized[key] = value[0]; // take the first if array
        } else {
            normalized[key] = value ?? "";
        }
    }
    return normalized;
}

export default function EditPostPage() {
    const rawPara = useLocalSearchParams();
    const params = normalizeParams(rawPara);
    const {
        postid,
        titleP,
        post_descriptionP,
        buildingP,
        post_floorP,
        nearest_roomP,
        found_atP,
        imageP,
    } = params;

    const [title, setTitle] = useState(titleP.trim());
    const [building, setBuilding] = useState(buildingP.trim());
    const [floor, setFloor] = useState(post_floorP.trim());

    const [room, setRoom] = useState(nearest_roomP.trim());
    const [date, setDate] = useState<Date>(
        found_atP ? new Date(found_atP) : new Date()
    );

    const [description, setDescription] = useState(post_descriptionP);
    const [imageUri, setImageUri] = useState<string>(imageP)

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isChange, setIsChange] = useState(false);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Please allow access to your photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            aspect: [9, 10],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setIsChange(true);
        }
    };

    const handleSubmit = async () => {

        if (!imageUri) {
            Alert.alert(
                'Thiếu hình ảnh',
                'Vui lòng chọn ít nhất một hình ảnh.'
            );
            return;
        }

        if (!date) {
            Alert.alert(
                'Thiếu thời gian',
                'Vui lòng chọn thời gian tìm thấy đồ.'
            );
            return;
        }

        if (!title.trim() || !building.trim() || !floor.trim() || !room.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường bắt buộc.');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();

            formData.append('title', title.trim());
            formData.append('building', building.trim());
            formData.append('post_floor', floor.trim());
            formData.append('nearest_room', room.trim());
            formData.append('found_at', date.toISOString().trim());
            formData.append('post_description', description.trim());

            const buildingKey = String(building).toLowerCase();
            const id = buildingMap[buildingKey];

            if (!id) {
                Alert.alert('Lỗi', 'Vui lòng chọn Tòa nhà hợp lệ.');
                return;
            }
            formData.append('thread_id', id.toString());


            if (imageUri) {
                const filename = imageUri.split('/').pop() ?? 'photo.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const ext = match?.[1]?.toLowerCase();

                let mimeType = 'image/jpeg';
                if (ext === 'png') mimeType = 'image/png';
                else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
                else if (ext === 'heic') mimeType = 'image/heic';

                formData.append('image_files', {
                    uri: imageUri,
                    name: filename,
                    type: mimeType,
                } as any);
            }
            console.log('Create payload:', formData);
            const res = await api.patch(`/post/update-post/${postid}`, formData, { isFormData: true });

            console.log('Create response:', res);
            Alert.alert('Thành công', 'Đã sửa bài đăng.', [
                {
                    text: 'OK',
                    onPress: () => {
                        // quay về dashboard, hoặc chuyển tới chi tiết bài mới tạo
                        router.back();
                    },
                },
            ]);
        } catch (err: any) {
            console.error('Create post error:', err);
            Alert.alert(
                'Lỗi',
                typeof err?.message === 'string'
                    ? err.message
                    : 'Không thể tạo bài đăng. Vui lòng thử lại.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <Stack.Screen
                options={{
                    headerTitle: 'Sửa bài đăng',
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

            <ScrollView
                style={{ flex: 1, backgroundColor: '#f9fafb' }}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Title */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Tiêu đề *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ví dụ: Nhặt được ví ở H1"
                        value={title}
                        onChangeText={(text) => {
                            setTitle(text)
                            setIsChange(true)
                        }
                        }
                    />
                </View>

                {/* Building + Floor */}
                <View style={styles.row}>
                    <View style={[styles.fieldGroup, styles.rowItem]}>
                        <Text style={styles.label}>Tòa nhà *</Text>
                        <CustomPicker
                            label="Chọn tòa nhà"
                            value={building}
                            items={BUILDINGS}
                            onValueChange={(text) => {
                                setIsChange(true)
                                setBuilding(text)
                            }
                            }
                            placeholder="Chọn tòa nhà"
                        />
                    </View>

                    <View style={[styles.fieldGroup, styles.rowItem]}>
                        <Text style={styles.label}>Tầng *</Text>
                        <CustomPicker
                            label="Chọn tầng"
                            value={floor}
                            items={FLOORS}
                            onValueChange={(text) => {
                                setIsChange(true)
                                setFloor(text)
                            }}
                            placeholder="Chọn tầng"
                        />
                    </View>
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Gần phòng *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="VD: 101, 202..."
                        value={room}
                        onChangeText={(text) => {
                            setIsChange(true)
                            setRoom(text)
                        }}
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Thời gian tìm thấy *</Text>
                    <CustomDateTimePicker
                        date={date}
                        onDateChange={(date) => {
                            setDate(date)
                            setIsChange(true)
                        }}
                        label="Chọn thời gian"
                    />
                </View>
                {/* Description */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Mô tả chi tiết</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Mô tả đồ vật, màu sắc, đặc điểm..."
                        value={description}
                        onChangeText={(text) => {
                            setIsChange(true)
                            setDescription(text)
                        }}
                        multiline
                        numberOfLines={4}
                    />
                </View>

                {/* Image picker */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Hình ảnh *</Text>
                    <View style={styles.imageRow}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.previewPlaceholder}>
                                <Ionicons name="image-outline" size={28} color="#9ca3af" />
                                <Text style={{ color: '#9ca3af', marginTop: 4 }}>
                                    Chưa chọn hình
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.imageButton}
                            onPress={handlePickImage}
                        >
                            <Ionicons name="camera-outline" size={20} color="#fff" />
                            <Text style={styles.imageButtonText}>Chọn hình</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Submit button */}
                <TouchableOpacity
                    style={[styles.submitButton, (isSubmitting || !isChange) && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={isSubmitting || !isChange}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Sửa bài đăng</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    fieldGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    input: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        fontSize: 14,
        color: '#111827',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        gap: 8,
    },
    rowItem: {
        flex: 1,
    },
    imageRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    previewImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#e5e7eb',
        marginRight: 12,
    },
    previewPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    imageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563EB',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
    },
    imageButtonText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 6,
    },
    submitButton: {
        marginBottom: 20,
        backgroundColor: '#2563EB',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalItemSelected: {
        backgroundColor: '#eff6ff',
    },
    modalItemText: {
        fontSize: 16,
        color: '#374151',
    },
    modalItemTextSelected: {
        color: '#2563EB',
        fontWeight: '600',
    },
});
