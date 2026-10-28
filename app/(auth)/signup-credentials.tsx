import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowLeft, Lock, Mail } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthErrorMessage, useAuth } from '../../contexts/auth-context';

export default function SignUpCredentialsScreen() {
  const router = useRouter();
  const { linkEmailPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const finish = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return Alert.alert('Check your email', 'Enter a valid email address.');
    if (password.length < 6) return Alert.alert('Password too short', 'Use at least 6 characters.');
    if (password !== confirmPassword) return Alert.alert('Passwords do not match', 'Enter the same password in both fields.');
    try {
      setLoading(true);
      await linkEmailPassword(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error) { Alert.alert('Could not finish account', getAuthErrorMessage(error)); }
    finally { setLoading(false); }
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: '#EEF7FD', paddingHorizontal: 22 }}>
    <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/signup-phone' as Href)} accessibilityLabel="Back" style={backStyle}><ArrowLeft size={19} color="#17242D" /></TouchableOpacity>
    <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'center' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={{ color: '#15212A', fontSize: 26, fontWeight: '900' }}>Finish your account</Text>
      <Text style={{ color: '#52616B', fontSize: 14, marginTop: 7, marginBottom: 26, lineHeight: 20 }}>Your phone is verified. Add an email and password for future sign-ins.</Text>
      <Field icon="mail" placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
      <Field icon="lock" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <Field icon="lock" placeholder="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="new-password" onSubmitEditing={finish} />
      <TouchableOpacity disabled={loading} onPress={finish} style={{ height: 50, borderRadius: 13, backgroundColor: '#24C6C9', alignItems: 'center', justifyContent: 'center', marginTop: 4, opacity: loading ? 0.7 : 1 }}>{loading ? <ActivityIndicator color="#071C21" /> : <Text style={{ color: '#071C21', fontWeight: '800' }}>CREATE ACCOUNT</Text>}</TouchableOpacity>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function Field({ icon, ...props }: React.ComponentProps<typeof TextInput> & { icon: 'mail' | 'lock' }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 13, borderWidth: 1, borderColor: '#D8E5EC', paddingHorizontal: 14, marginBottom: 13 }}>{icon === 'mail' ? <Mail size={19} color="#24C6C9" /> : <Lock size={19} color="#24C6C9" />}<TextInput {...props} autoCapitalize="none" placeholderTextColor="#91A0AA" style={{ flex: 1, height: 52, marginLeft: 10, color: '#15212A', fontSize: 15 }} /></View>;
}

const backStyle = { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D8E5EC', alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 10 };
