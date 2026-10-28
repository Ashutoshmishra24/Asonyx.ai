import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View, type TextInputInstance } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowLeft, RotateCcw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthErrorMessage, useAuth } from '../../contexts/auth-context';

const INPUTS = [0, 1, 2, 3, 4, 5];

export default function OTPScreen() {
  const router = useRouter();
  const { confirmPhoneCode, pendingPhone, sendPhoneCode } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const refs = useRef<Array<TextInputInstance | null>>([]);

  const handleInput = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    setOtp(current => current.map((value, position) => position === index ? digit : value));
    if (digit && index < INPUTS.length - 1) refs.current[index + 1]?.focus();
  };

  const verify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return Alert.alert('Enter the code', 'Enter all 6 digits from the Firebase SMS.');
    try {
      setLoading(true);
      await confirmPhoneCode(code);
      router.push('/(auth)/signup-credentials' as Href);
    } catch (error) { Alert.alert('Could not verify code', getAuthErrorMessage(error)); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    if (!pendingPhone) return router.replace('/(auth)/signup-phone' as Href);
    try {
      setResending(true);
      await sendPhoneCode(pendingPhone);
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
      Alert.alert('Code sent', `A new verification code was sent to ${pendingPhone}.`);
    } catch (error) { Alert.alert('Could not resend code', getAuthErrorMessage(error)); }
    finally { setResending(false); }
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: '#EEF7FD', paddingHorizontal: 22 }}>
    <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/signup-phone' as Href)} accessibilityLabel="Back" style={backStyle}><ArrowLeft size={19} color="#17242D" /></TouchableOpacity>
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <Text style={{ color: '#15212A', fontSize: 26, fontWeight: '900' }}>Verify your phone</Text>
      <Text style={{ color: '#52616B', fontSize: 14, marginTop: 7, lineHeight: 20 }}>Enter the 6-digit code sent to {pendingPhone ?? 'your phone'}.</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 28, marginBottom: 24 }}>
        {otp.map((digit, index) => <TextInput key={index} ref={input => { refs.current[index] = input; }} autoFocus={index === 0} value={digit} onChangeText={text => handleInput(text, index)} onKeyPress={({ nativeEvent }) => { if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) refs.current[index - 1]?.focus(); }} keyboardType="number-pad" maxLength={1} selectTextOnFocus style={{ width: 46, height: 58, borderRadius: 12, borderWidth: digit ? 1.5 : 1, borderColor: digit ? '#28C7C9' : '#C7D8E2', backgroundColor: '#FFF', textAlign: 'center', color: '#15212A', fontSize: 22, fontWeight: '700' }} />)}
      </View>
      <TouchableOpacity disabled={loading} onPress={verify} style={{ height: 50, borderRadius: 13, backgroundColor: '#24C6C9', alignItems: 'center', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>{loading ? <ActivityIndicator color="#071C21" /> : <Text style={{ color: '#071C21', fontWeight: '800' }}>VERIFY OTP</Text>}</TouchableOpacity>
      <TouchableOpacity disabled={resending} onPress={resend} style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, padding: 14, marginTop: 8 }}>{resending ? <ActivityIndicator size="small" color="#1ABDC1" /> : <RotateCcw size={14} color="#1ABDC1" />}<Text style={{ color: '#1ABDC1', fontSize: 13 }}>Resend code</Text></TouchableOpacity>
    </View>
  </SafeAreaView>;
}

const backStyle = { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D8E5EC', alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 10 };
