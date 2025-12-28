import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loginTheme } from '../../styles/theme';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';


// Cấu hình hằng số
const DOMAIN_REQUIRED = '@hcmut.edu.vn';
const RESEND_TIMEOUT = 60; // 30 giây đếm ngược

export default function LoginScreen() {
  // --- STATE ---
  const [step, setStep] = useState<'input_email' | 'input_otp'>('input_email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [timer, setTimer] = useState(0);

  // --- EFFECTS ---
  // Xử lý đếm ngược timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // --- HANDLERS ---

  // 1. Xử lý gửi OTP
  const handleGetOtp = async () => {
    setErrorMessage('');
    Keyboard.dismiss();

    // Validate Client-side
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập email.');
      return;
    }
    if (!email.toLowerCase().endsWith(DOMAIN_REQUIRED)) {
      setErrorMessage(`Email phải có đuôi ${DOMAIN_REQUIRED}`);
      return;
    }

    setIsLoading(true);

    try {
      const mssv = email.toLowerCase().replace(DOMAIN_REQUIRED, '');

      console.log('Sending request for:', mssv);

      // Gọi API (Dùng fetch wrapper)
      await api.post('/auth/request-otp', {
        email: mssv
      }, {});
      setIsLoading(false);
      setStep('input_otp');
      setTimer(RESEND_TIMEOUT);
      Alert.alert('Thành công', 'Mã OTP đã được gửi đến email của bạn.');

    } catch (error: any) {
      setIsLoading(false);
      console.error('Error requesting OTP:', error);
      setErrorMessage(error.message || 'Không thể kết nối đến máy chủ.');
    }
  };

  // 2. Xử lý nút Gửi lại OTP
  const handleResendOtp = async () => {
    if (timer > 0) return;
    await handleGetOtp();
  };

  // 3. Xử lý Đăng nhập
  const handleLogin = async () => {
    if (otp.length < 4) {
      setErrorMessage('Vui lòng nhập mã OTP hợp lệ.');
      return;
    }

    setIsLoading(true);

    try {
      const mssv = email.toLowerCase().replace(DOMAIN_REQUIRED, '');

      // Gọi API verify
      const response = await api.post('/auth/verify-otp', {
        email: mssv,
        otp_code: otp
      }, {});

      const { access_token } = response;
      console.log('verify otp response:', response);
      console.log('access_token:', access_token, typeof access_token);

      if (access_token && typeof access_token === 'string') {
        // Lưu token
        await SecureStore.setItemAsync('auth_token', access_token);
        await SecureStore.setItemAsync('user_email', email);

        setIsLoading(false);
        router.replace('/');
      } else {
        setIsLoading(false);
        throw new Error(
          Array.isArray(access_token)
            ? access_token[0]
            : 'Invalid token'
        );
      }

    } catch (error: any) {
      setIsLoading(false);
      console.error('Login error:', error);
      setErrorMessage(error.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    }
  };


  // --- RENDER UI ---
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.contentContainer}>

          {/* LOGO / HEADER */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={{ width: 200, height: 200 }}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>LOFY</Text>
            <Text style={styles.subtitle}>Lost & Found for HCMUT Students</Text>
          </View>

          {/* FORM INPUT */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>
              {step === 'input_email' ? 'Đăng nhập' : 'Xác thực OTP'}
            </Text>

            {/* EMAIL FIELD */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email của trường</Text>
              <View style={[styles.inputContainer, step === 'input_otp' && styles.disabledInput]}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="mssv@hcmut.edu.vn"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={step === 'input_email'}
                />
                {/* Checkmark xanh nếu email đúng định dạng */}
                {email.endsWith(DOMAIN_REQUIRED) && (
                  <Ionicons name="checkmark-circle" size={20} color="green" />
                )}
              </View>
            </View>

            {/* OTP FIELD (Chỉ hiện khi ở bước 2) */}
            {step === 'input_otp' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mã xác thực (OTP)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="key-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập mã OTP..."
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>

                {/* Bộ đếm ngược Resend */}
                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>Chưa nhận được mã? </Text>
                  {timer > 0 ? (
                    <Text style={styles.timerText}>Gửi lại sau {timer}s</Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendOtp}>
                      <Text style={styles.resendLink}>Gửi lại ngay</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* ERROR MESSAGE */}
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            {/* ACTION BUTTON */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={step === 'input_email' ? handleGetOtp : handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {step === 'input_email' ? 'LẤY MÃ OTP' : 'ĐĂNG NHẬP'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Quay lại nhập email (nếu đang ở bước OTP) */}
            {step === 'input_otp' && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setStep('input_email');
                  setOtp('');
                  setErrorMessage('');
                }}
              >
                <Text style={styles.backButtonText}>Đổi email khác</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: loginTheme.colors.primary, // Màu xanh chủ đạo (Primary color)
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 200,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    //backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    marginRight: 20,
    marginBottom: 16,
  },
  appName: {
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#bfdbfe', // Xanh nhạt
    marginTop: 5,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: '#f9fafb',
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    opacity: 0.7,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111',
  },
  resendContainer: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  resendText: {
    fontSize: 13,
    color: '#6b7280',
  },
  timerText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '600',
  },
  resendLink: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
});