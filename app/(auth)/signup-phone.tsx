import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Phone } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthErrorMessage, useAuth } from '../../contexts/auth-context';

export default function SignUpPhoneScreen() {
  const router = useRouter();
  const { sendPhoneCode } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const continueSignup = async () => {
    const normalized = phone.replace(/[\s()-]/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) return Alert.alert('Check your phone number', 'Include the country code, for example +91 98765 43210.');
    try {
      setLoading(true);
      await sendPhoneCode(normalized);
      router.push('/(auth)/otp');
    } catch (error) { Alert.alert('Could not send code', getAuthErrorMessage(error)); }
    finally { setLoading(false); }
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: '#EEF7FD', paddingHorizontal: 22 }}>
    <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/login')} accessibilityLabel="Back" style={backStyle}><ArrowLeft size={19} color="#17242D" /></TouchableOpacity>
    <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'center' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={{ fontSize: 26, fontWeight: '900', color: '#15212A' }}>Create your account</Text>
      <Text style={{ color: '#52616B', fontSize: 14, lineHeight: 20, marginTop: 7, marginBottom: 28 }}>First, verify your phone number. Firebase will send a 6-digit SMS code.</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 13, borderWidth: 1, borderColor: '#D8E5EC', paddingHorizontal: 14 }}><Phone size={19} color="#24C6C9" /><TextInput autoFocus style={{ flex: 1, height: 52, marginLeft: 10, fontSize: 16, color: '#15212A' }} value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" placeholderTextColor="#91A0AA" keyboardType="phone-pad" autoComplete="tel" returnKeyType="go" onSubmitEditing={continueSignup} /></View>
      <TouchableOpacity disabled={loading} onPress={continueSignup} style={{ height: 50, borderRadius: 13, backgroundColor: '#24C6C9', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 16, opacity: loading ? 0.7 : 1 }}>{loading ? <ActivityIndicator color="#071C21" /> : <><Text style={{ color: '#071C21', fontWeight: '800' }}>SEND OTP</Text><ArrowRight size={17} color="#071C21" /></>}</TouchableOpacity>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const backStyle = { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D8E5EC', alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 10 };
