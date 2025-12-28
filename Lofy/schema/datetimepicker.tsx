// CustomDateTimePicker.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface CustomDateTimePickerProps {
    date: Date;
    onDateChange: (date: Date) => void;
    label: string;
}

export default function CustomDateTimePicker({
    date,
    onDateChange,
    label,
}: CustomDateTimePickerProps) {
    const [showModal, setShowModal] = useState(false);
    const [tempDate, setTempDate] = useState(date);
    const [mode, setMode] = useState<'date' | 'time'>('date');

    const formatDate = (d: Date) => {
        return d.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatTime = (d: Date) => {
        return d.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleConfirm = () => {
        onDateChange(tempDate);
        setShowModal(false);
        setMode('date');
    };

    const handleCancel = () => {
        setTempDate(date);
        setShowModal(false);
        setMode('date');
    };

    const onNativeChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowModal(false);
            if (event.type === 'set' && selectedDate) {
                setTempDate(selectedDate);
                onDateChange(selectedDate);
            }
        } else if (selectedDate) {
            setTempDate(selectedDate);
        }

    };

    return (
        <>
            <TouchableOpacity
                style={styles.input}
                onPress={() => setShowModal(true)}
            >
                <View style={styles.dateDisplay}>
                    <View style={styles.dateItem}>
                        <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                        <Text style={styles.dateText}>{formatDate(date)}</Text>
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.dateItem}>
                        <Ionicons name="time-outline" size={20} color="#2563EB" />
                        <Text style={styles.dateText}>{formatTime(date)}</Text>
                    </View>
                </View>
                <Ionicons name="chevron-down" size={20} color="#9ca3af" />
            </TouchableOpacity>

            {Platform.OS === 'ios' ? (
                // iOS Modal with custom UI
                <Modal
                    visible={showModal}
                    transparent
                    animationType="slide"
                    onRequestClose={handleCancel}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={handleCancel}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{label}</Text>
                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        onPress={handleCancel}
                                        style={styles.modalButton}
                                    >
                                        <Text style={styles.cancelText}>Hủy</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleConfirm}
                                        style={[styles.modalButton, styles.confirmButton]}
                                    >
                                        <Text style={styles.confirmText}>Xong</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.pickerContainer}>
                                <View style={styles.modeSelector}>
                                    <TouchableOpacity
                                        style={[
                                            styles.modeButton,
                                            mode === 'date' && styles.modeButtonActive,
                                        ]}
                                        onPress={() => setMode('date')}
                                    >
                                        <Ionicons
                                            name="calendar"
                                            size={18}
                                            color={mode === 'date' ? '#fff' : '#6b7280'}
                                        />
                                        <Text
                                            style={[
                                                styles.modeButtonText,
                                                mode === 'date' && styles.modeButtonTextActive,
                                            ]}
                                        >
                                            Ngày
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.modeButton,
                                            mode === 'time' && styles.modeButtonActive,
                                        ]}
                                        onPress={() => setMode('time')}
                                    >
                                        <Ionicons
                                            name="time"
                                            size={18}
                                            color={mode === 'time' ? '#fff' : '#6b7280'}
                                        />
                                        <Text
                                            style={[
                                                styles.modeButtonText,
                                                mode === 'time' && styles.modeButtonTextActive,
                                            ]}
                                        >
                                            Giờ
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <DateTimePicker
                                    value={tempDate}
                                    mode={mode}
                                    is24Hour={true}
                                    display="spinner"
                                    onChange={onNativeChange}
                                    textColor="#111827"
                                    style={styles.picker}
                                />
                            </View>
                        </View>
                    </TouchableOpacity>
                </Modal>
            ) : (
                // Android native picker
                showModal && (
                    <DateTimePicker
                        value={tempDate}
                        mode={mode}
                        is24Hour={true}
                        display="default"
                        onChange={onNativeChange}
                    />
                )
            )}
        </>
    );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    separator: {
        width: 1,
        height: 20,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 12,
    },
    dateText: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
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
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
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
    modalActions: {
        flexDirection: 'row',
        gap: 8,
    },
    modalButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    confirmButton: {
        backgroundColor: '#2563EB',
    },
    cancelText: {
        fontSize: 15,
        color: '#6b7280',
        fontWeight: '600',
    },
    confirmText: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '600',
    },
    pickerContainer: {
        padding: 16,
    },
    modeSelector: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderRadius: 10,
        padding: 4,
        marginBottom: 16,
    },
    modeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
        backgroundColor: 'transparent',
    },
    modeButtonActive: {
        backgroundColor: '#2563EB',
    },
    modeButtonText: {
        fontSize: 15,
        color: '#6b7280',
        fontWeight: '600',
    },
    modeButtonTextActive: {
        color: '#fff',
    },
    picker: {
        height: 200,
    },
});