import { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowRight, Lock, Mail } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthErrorMessage, useAuth } from '../../contexts/auth-context';

const TEAL = '#24C6C9';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || !password) return Alert.alert('Check your details', 'Enter your email address and password.');
    try {
      setLoading(true);
      await signInWithEmail(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error) { Alert.alert('Could not sign in', getAuthErrorMessage(error)); }
    finally { setLoading(false); }
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: '#EEF7FD' }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 22, paddingTop: 48, paddingBottom: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View style={{ width: 104, height: 104, borderRadius: 24, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#52D4D2', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><Image source={require('../../assets/brand/asonyx-logo.jpg')} resizeMode="contain" style={{ width: 96, height: 96 }} /></View>
          <Text style={{ fontSize: 26, fontWeight: '900', color: '#16242E', letterSpacing: 2.5, marginTop: 10 }}>ASONYX <Text style={{ color: '#178E91' }}>AI</Text></Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={{ fontSize: 23, fontWeight: '800', color: '#101B23', textAlign: 'center' }}>Welcome back</Text>
          <Text style={{ fontSize: 14, color: '#52616B', textAlign: 'center', marginTop: 5, marginBottom: 22 }}>Sign in to continue with your smart helmet</Text>
          <View style={fieldStyle}><Mail size={19} color={TEAL} /><TextInput style={inputStyle} placeholder="Email address" placeholderTextColor="#7A8993" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" /></View>
          <View style={fieldStyle}><Lock size={19} color={TEAL} /><TextInput style={inputStyle} placeholder="Password" placeholderTextColor="#7A8993" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password" returnKeyType="go" onSubmitEditing={handleEmailSignIn} /></View>
          <TouchableOpacity disabled={loading} onPress={handleEmailSignIn} style={{ height: 50, borderRadius: 13, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: loading ? 0.7 : 1 }}>{loading ? <ActivityIndicator color="#071C21" /> : <><Text style={{ color: '#071C21', fontSize: 15, fontWeight: '800' }}>SIGN IN</Text><ArrowRight size={17} color="#071C21" /></>}</TouchableOpacity>
          <TouchableOpacity disabled={loading} onPress={() => router.replace('/(tabs)')} style={{ height: 48, borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BFD3DC', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
            <Text style={{ color: '#168F87', fontSize: 14, fontWeight: '800' }}>CONTINUE IN DEMO MODE</Text>
          </TouchableOpacity>
          <Text style={{ color: '#82919B', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 7 }}>Opens the UI without creating an account. Demo data stays on this device.</Text>
        </View>
        <Text style={{ color: '#52616B', fontSize: 13, textAlign: 'center', marginTop: 28 }}>New rider? <Text onPress={() => router.push('/(auth)/signup-credentials' as Href)} style={{ color: '#1ABDC1', fontWeight: '800', textDecorationLine: 'underline' }}>Create Account</Text></Text>
        <Text style={{ color: '#82919B', fontSize: 11, textAlign: 'center', marginTop: 10 }}>Firebase email authentication • Expo Go compatible</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const fieldStyle = { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: '#FFF', borderRadius: 13, borderWidth: 1, borderColor: '#D8E5EC', paddingHorizontal: 14, marginBottom: 13 };
const inputStyle = { flex: 1, height: 50, fontSize: 15, color: '#15222B', marginLeft: 10 };
