import { useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowLeft, FileText, Fingerprint, LockKeyhole, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyScreen() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState(false);
  const [personalization, setPersonalization] = useState(false);
  const [biometricLock, setBiometricLock] = useState(false);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#EEF7FD' }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/settings')} accessibilityLabel="Back to settings" style={{ width: 40, height: 40, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#D8E5EC', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><ArrowLeft size={19} color="#17232C" /></TouchableOpacity>
        <Text style={{ color: '#17232C', fontSize: 24, fontWeight: '900' }}>Privacy & Security</Text>
        <Text style={{ color: '#64748B', fontSize: 13, marginTop: 4, marginBottom: 18 }}>Manage privacy preferences for this device.</Text>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 17, padding: 15, borderWidth: 1, borderColor: '#D8E5EC', marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7 }}><ShieldCheck size={19} color="#168F87" /><Text style={{ color: '#17232C', fontSize: 14, fontWeight: '900' }}>Your data in this preview</Text></View>
          <Text style={{ color: '#64748B', fontSize: 12, lineHeight: 18 }}>Profile and preference changes stay in app memory. Files you import to Document Vault are stored in the app’s private document folder on this device. This screen does not connect to an Asonyx account server.</Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 17, paddingHorizontal: 14, borderWidth: 1, borderColor: '#D8E5EC' }}>
          <View style={{ minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#EDF1F4' }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}><FileText size={18} color="#64748B" /></View>
            <View style={{ flex: 1 }}><Text style={{ color: '#17232C', fontSize: 13, fontWeight: '800' }}>Usage analytics</Text><Text style={{ color: '#7B8992', fontSize: 10, marginTop: 3 }}>Optional; nothing is uploaded in this preview</Text></View>
            <Switch value={analytics} onValueChange={setAnalytics} trackColor={{ false: '#D9E2E7', true: '#5DC6BB' }} thumbColor="#FFF" />
          </View>
          <View style={{ minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#EDF1F4' }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={18} color="#64748B" /></View>
            <View style={{ flex: 1 }}><Text style={{ color: '#17232C', fontSize: 13, fontWeight: '800' }}>Personalized recommendations</Text><Text style={{ color: '#7B8992', fontSize: 10, marginTop: 3 }}>On-device preference for this session</Text></View>
            <Switch value={personalization} onValueChange={setPersonalization} trackColor={{ false: '#D9E2E7', true: '#5DC6BB' }} thumbColor="#FFF" />
          </View>
          <View style={{ minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}><Fingerprint size={18} color="#64748B" /></View>
            <View style={{ flex: 1 }}><Text style={{ color: '#17232C', fontSize: 13, fontWeight: '800' }}>Biometric app lock</Text><Text style={{ color: '#7B8992', fontSize: 10, marginTop: 3 }}>Preference preview; device authentication is not connected</Text></View>
            <Switch value={biometricLock} onValueChange={setBiometricLock} trackColor={{ false: '#D9E2E7', true: '#5DC6BB' }} thumbColor="#FFF" />
          </View>
        </View>

        <TouchableOpacity onPress={() => router.push('/documents')} style={{ marginTop: 14, backgroundColor: '#FFFFFF', borderRadius: 15, borderWidth: 1, borderColor: '#D8E5EC', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}><LockKeyhole size={18} color="#168F87" /><Text style={{ color: '#17232C', fontSize: 13, fontWeight: '800', flex: 1 }}>Manage files in Document Vault</Text><Text style={{ color: '#168F87', fontSize: 12, fontWeight: '800' }}>OPEN</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/settings/terms' as Href)} style={{ marginTop: 10, alignSelf: 'flex-start', paddingVertical: 8 }}><Text style={{ color: '#168F87', fontSize: 12, fontWeight: '800', textDecorationLine: 'underline' }}>View Privacy Policy and Terms</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
