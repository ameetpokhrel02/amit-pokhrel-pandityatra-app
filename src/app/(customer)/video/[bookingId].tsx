import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/store/ThemeContext';
import { generateVideoJoinLink } from '@/services/video.service';

export default function VideoCallScreen() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const router = useRouter();
    const { colors } = useTheme();

    const [loading, setLoading] = useState(true);
    const [roomUrl, setRoomUrl] = useState<string | null>(null);

    useEffect(() => {
        if (bookingId) {
            fetchRoomUrl();
        }
    }, [bookingId]);

    const fetchRoomUrl = async () => {
        try {
            setLoading(true);
            const roomData = await generateVideoJoinLink(parseInt(bookingId));
            setRoomUrl(roomData.room_url);
        } catch (error) {
            console.error('Video call setup failed:', error);
            Alert.alert('Error', 'Failed to prepare video call session.');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: '#000' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Preparing your sacred session...</Text>
            </View>
        );
    }

    if (!roomUrl) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: '#000' }]}>
                <Text style={styles.errorText}>Unable to load call room.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close-circle" size={32} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Live Puja Session</Text>
            </View>

            <WebView
                source={{ uri: roomUrl }}
                style={styles.webview}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                renderLoading={() => (
                    <View style={styles.webviewLoading}>
                        <ActivityIndicator size="large" color="white" />
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },
    errorText: {
        color: 'white',
        fontSize: 16,
        marginBottom: 20,
    },
    backButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#FF6F00',
        borderRadius: 8,
    },
    backButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        backgroundColor: '#1A1A1A',
    },
    closeButton: {
        marginRight: 15,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    webview: {
        flex: 1,
        backgroundColor: '#000',
    },
    webviewLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
