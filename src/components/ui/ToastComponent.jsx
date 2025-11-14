import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';

const TOAST_DURATION = 3000;

export default function ToastComponent({ message, type, isVisible, onDismiss, colors }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isVisible) {
            // Animation for appearing
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                // Timeout before disappearing
                const timer = setTimeout(() => {
                    // Animation for disappearing
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }).start(onDismiss);
                }, TOAST_DURATION);
                return () => clearTimeout(timer);
            });
        }
    }, [isVisible, fadeAnim, onDismiss]);

    if (!isVisible || !message) return null;

    // Use theme colors passed from parent
    const backgroundColor = type === 'success' 
        ? colors.primary || '#4CAF50' 
        : colors.error || '#F44336';
    const textColor = colors.onPrimary || '#FFFFFF'; 

    return (
        <Animated.View
            style={{
                position: 'absolute',
                top: 50,
                left: 20,
                right: 20,
                backgroundColor,
                borderRadius: 8,
                padding: 14,
                zIndex: 1000,
                alignItems: 'center',
                opacity: fadeAnim,
                transform: [{ translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                }) }],
            }}
        >
            <Text style={{ color: textColor, fontWeight: '700', textAlign: 'center' }}>
                {`${type === 'success' ? '✅' : '❌'} ${message}`}
            </Text>
        </Animated.View>
    );
};