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
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api'; 

// Danh sách các lý do báo cáo có sẵn
const REPORT_REASONS = [
  'Spam or scam',
  'Inappropriate content',
  'False information',
  'Harassment',
  'Other' // Tùy chọn này sẽ mở ra ô nhập liệu title tùy chỉnh
];

export default function ReportScreen() {
  const { postid } = useLocalSearchParams();
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [customTitle, setCustomTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // 1. Xác định Title cuối cùng
    const finalTitle = selectedReason === 'Other' ? customTitle.trim() : selectedReason;

    // 2. Validate
    if (!finalTitle) {
      Alert.alert('Missing Information', 'Please select a reason or specify one.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Missing Information', 'Please provide a description of the issue.');
      return;
    }

    setIsSubmitting(true);

    try {
      const postIdStr = Array.isArray(postid) ? postid[0] : postid;
      
      const payload = {
        title: finalTitle,
        report_message: message,
        post_id: postIdStr 
      };

      // 3. Gọi API gửi báo cáo
      // Endpoint giả định: POST /posts/{id}/report
      await api.post(`/others/report/send-report`, payload, {});

      Alert.alert(
        'Report Submitted',
        'Thank you for keeping our community safe. We will review your report shortly.',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    } catch (error: any) {
      console.error(error);
      const msg = error.message || 'Failed to submit report. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerTitle: 'Report Post',
          headerBackTitleVisible: false,
          headerTintColor: '#333',
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
              Your report is anonymous. Please select the reason why this post is inappropriate.
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
          {selectedReason === 'Other' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Specify Reason <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Copyright violation..."
                placeholderTextColor="#9ca3af"
                value={customTitle}
                onChangeText={setCustomTitle}
              />
            </View>
          )}

          {/* Section: Message/Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Additional Details <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Please provide more context about the issue..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
          </View>

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
              <Text style={styles.submitBtnText}>Submit Report</Text>
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