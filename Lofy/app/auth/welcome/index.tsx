import React from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
    const handleContinue = async () => {
        await AsyncStorage.setItem('hasSeenWelcome', 'true');
        router.replace('/auth/login');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Image */}
            <Image
                source={require('../../../assets/WelcomePage.png')}
                style={styles.image}
                resizeMode="cover"
            />

            {/* Text */}
            <View style={styles.textContainer}>
                <Text style={styles.title}>Chào mừng bạn👋</Text>
                <Text style={styles.subtitle}>
                    Tìm và trả lại đồ thất lạc ở Bách Khoa chưa bao giờ dễ như này
                </Text>
                <Text style={styles.subtitle}> Tin cậy - Dễ dàng - Minh bạch</Text>
            </View>

            {/* Button */}
            <TouchableOpacity style={styles.button} onPress={handleContinue}>
                <Text style={styles.buttonText}>Let's Go!</Text>
            </TouchableOpacity>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 24,
        justifyContent: 'space-between',
    },
    image: {
        width: '100%',
        height: '70%',
        marginTop: 0,
        borderRadius: 20,
    },
    textContainer: {
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    subtitle: {
        fontFamily: 'Roboto',
        fontSize: 16,
        textAlign: 'center',
        color: '#6B7280',
        lineHeight: 22,
    },
    button: {
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 32,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
