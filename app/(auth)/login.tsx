import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { ArrowRight, Lock, Mail } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthErrorMessage, useAuth } from '../../contexts/auth-context';

WebBrowser.maybeCompleteAuthSession();

const TEAL = '#24C6C9';

function GoogleMark() {
  return <Svg width={20} height={20} viewBox="0 0 24 24" accessibilityLabel="Google logo">
    <Path fill="#4285F4" d="M23.49 12.276c0-.851-.076-1.67-.218-2.455H12v4.644h6.72a5.744 5.744 0 0 1-2.49 3.77v3.08h4.03c2.36-2.158 3.73-5.325 3.73-9.039Z" />
    <Path fill="#34A853" d="M12 24c3.24 0 5.956-1.074 7.947-2.91l-4.03-3.08c-1.11.744-2.53 1.184-3.917 1.184-3.014 0-5.568-2.035-6.48-4.77H1.355v3.08A12 12 0 0 0 12 24Z" />
    <Path fill="#FBBC05" d="M5.52 14.424A7.2 7.2 0 0 1 5.145 12c0-.84.145-1.65.375-2.424V6.496H1.355A12 12 0 0 0 0 12c0 1.944.465 3.78 1.355 5.504l4.165-3.08Z" />
    <Path fill="#EA4335" d="M12 4.77c1.77 0 3.36.61 4.61 1.806l3.45-3.45C17.95 1.236 15.24 0 12 0A12 12 0 0 0 1.355 6.496l4.165 3.08C6.432 6.805 8.986 4.77 12 4.77Z" />
  </Svg>;
}

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogleIdToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<'email' | 'google' | null>(null);
  const processedGoogleToken = useRef<string | null>(null);
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const [googleRequest, googleResponse, promptGoogle] = Google.useIdTokenAuthRequest({
    webClientId,
    androidClientId: androidClientId ?? webClientId,
    iosClientId: iosClientId ?? webClientId,
    selectAccount: true,
  });

  useEffect(() => {
    if (googleResponse?.type !== 'success') return;
    const idToken = googleResponse.params.id_token ?? googleResponse.authentication?.idToken;
    if (!idToken) {
      Promise.resolve().then(() => setLoading(null));
      Alert.alert('Google sign-in failed', 'Google did not return an identity token.');
      return;
    }
    if (processedGoogleToken.current === idToken) return;
    processedGoogleToken.current = idToken;
    signInWithGoogleIdToken(idToken)
      .then(() => router.replace('/(tabs)'))
      .catch(error => Alert.alert('Google sign-in failed', getAuthErrorMessage(error)))
      .finally(() => setLoading(null));
  }, [googleResponse, router, signInWithGoogleIdToken]);

  const handleEmailSignIn = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || !password) return Alert.alert('Check your details', 'Enter your email address and password.');
    try {
      setLoading('email');
      await signInWithEmail(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error) { Alert.alert('Could not sign in', getAuthErrorMessage(error)); }
    finally { setLoading(null); }
  };

  const handleGoogleSignIn = async () => {
    const platformClientId = Platform.OS === 'android' ? androidClientId : Platform.OS === 'ios' ? iosClientId : webClientId;
    if (!platformClientId) {
      Alert.alert('Google sign-in setup needed', `Add EXPO_PUBLIC_GOOGLE_${Platform.OS.toUpperCase()}_CLIENT_ID to .env.local.`);
      return;
    }
    try {
      setLoading('google');
      const result = await promptGoogle();
      if (result.type !== 'success') setLoading(null);
    } catch (error) {
      setLoading(null);
      Alert.alert('Google sign-in failed', getAuthErrorMessage(error));
    }
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
          <TouchableOpacity disabled={!!loading} onPress={handleEmailSignIn} style={{ height: 50, borderRadius: 13, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: loading ? 0.7 : 1 }}>{loading === 'email' ? <ActivityIndicator color="#071C21" /> : <><Text style={{ color: '#071C21', fontSize: 15, fontWeight: '800' }}>SIGN IN</Text><ArrowRight size={17} color="#071C21" /></>}</TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}><View style={{ flex: 1, height: 1, backgroundColor: '#D8E5EC' }} /><Text style={{ marginHorizontal: 12, color: '#52616B', fontSize: 12 }}>or</Text><View style={{ flex: 1, height: 1, backgroundColor: '#D8E5EC' }} /></View>
          <TouchableOpacity disabled={!!loading || !googleRequest} onPress={handleGoogleSignIn} style={{ height: 50, borderRadius: 13, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D8E5EC', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, opacity: loading || !googleRequest ? 0.7 : 1 }}>{loading === 'google' ? <ActivityIndicator color="#4285F4" /> : <><GoogleMark /><Text style={{ color: '#17242D', fontWeight: '700', fontSize: 14 }}>Continue with Google</Text></>}</TouchableOpacity>
        </View>
        <Text style={{ color: '#52616B', fontSize: 13, textAlign: 'center', marginTop: 28 }}>New rider? <Text onPress={() => router.push('/(auth)/signup-credentials' as Href)} style={{ color: '#1ABDC1', fontWeight: '800', textDecorationLine: 'underline' }}>Create Account</Text></Text>
        <Text style={{ color: '#82919B', fontSize: 11, textAlign: 'center', marginTop: 10 }}>Firebase email authentication • Google uses browser OAuth</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const fieldStyle = { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: '#FFF', borderRadius: 13, borderWidth: 1, borderColor: '#D8E5EC', paddingHorizontal: 14, marginBottom: 13 };
const inputStyle = { flex: 1, height: 50, fontSize: 15, color: '#15222B', marginLeft: 10 };
