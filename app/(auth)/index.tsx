import { useEffect, useRef } from 'react';
import { Animated, Image, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../contexts/auth-context';

export default function SplashScreen() {
  const router = useRouter();
  const { user, initializing } = useAuth();
  const scale = useRef(new Animated.Value(0.94)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(progress, { toValue: 1, duration: 1550, useNativeDriver: false }),
    ]).start();

    if (initializing) return;
    const timer = setTimeout(() => router.replace(user ? '/(tabs)' : '/(auth)/login'), 1900);
    return () => {
      clearTimeout(timer);
      scale.stopAnimation();
      opacity.stopAnimation();
      progress.stopAnimation();
    };
  }, [initializing, opacity, progress, router, scale, user]);

  return (
    <View style={{ flex: 1, backgroundColor: '#03131D' }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#010A11', '#071B27', '#03131D']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ ...absoluteFill, alignItems: 'center', justifyContent: 'center' }} />
      <View style={{ position: 'absolute', width: 270, height: 270, borderRadius: 135, backgroundColor: 'rgba(19,151,166,0.12)', shadowColor: '#18B8C4', shadowOpacity: 0.35, shadowRadius: 80, elevation: 24, top: '30%', alignSelf: 'center' }} />

      <Animated.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity, transform: [{ scale }] }}>
        <View style={{ width: 190, height: 190, borderRadius: 30, backgroundColor: 'rgba(122,172,184,0.26)', borderWidth: 1, borderColor: 'rgba(91,210,216,0.42)', alignItems: 'center', justifyContent: 'center', shadowColor: '#18B8C4', shadowOpacity: 0.34, shadowRadius: 32, elevation: 18 }}>
          <View style={{ width: 132, height: 132, borderRadius: 19, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <Image source={require('../../assets/brand/asonyx-logo.jpg')} resizeMode="contain" style={{ width: 128, height: 128 }} />
          </View>
        </View>

        <Text style={{ fontSize: 28, fontWeight: '900', color: '#F2F7FA', letterSpacing: 4.5, marginTop: 44 }}>
          ASONYX<Text style={{ color: '#25D1D1' }}>AI</Text>
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 8 }}>
          <View style={{ width: 22, height: 1, backgroundColor: '#188C98' }} />
          <Text style={{ color: '#4DB2BC', fontSize: 11, fontWeight: '600', letterSpacing: 3.2 }}>SMART HELMET INTELLIGENCE</Text>
          <View style={{ width: 22, height: 1, backgroundColor: '#188C98' }} />
        </View>
      </Animated.View>

      <View style={{ position: 'absolute', bottom: '12%', alignSelf: 'center', alignItems: 'center' }}>
        <View style={{ width: 148, height: 3, borderRadius: 2, backgroundColor: 'rgba(40,190,197,0.18)', overflow: 'hidden' }}>
          <Animated.View style={{ height: '100%', width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: '#25CDD1' }} />
        </View>
        <Text style={{ color: '#B9CDD2', fontSize: 9, fontWeight: '700', letterSpacing: 1.6, marginTop: 11 }}>SYSTEM READY</Text>
      </View>
    </View>
  );
}

const absoluteFill = { position: 'absolute' as const, top: 0, right: 0, bottom: 0, left: 0 };
