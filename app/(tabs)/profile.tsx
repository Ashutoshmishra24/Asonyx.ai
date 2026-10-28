import { useState } from 'react';
import {
  Alert, Image, Modal, ScrollView, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Cpu, Edit2, IdCard, Phone, Shield, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const INK = '#17232C';
const MUTED = '#64748B';
const TEAL = '#168F87';
const BORDER = '#D8E5EC';

function DetailRow({ icon: Icon, label, value }: { icon: typeof IdCard; label: string; value: string }) {
  return (
    <View style={{ minHeight: 52, borderBottomWidth: 1, borderBottomColor: '#E9EFF3', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Icon size={18} color="#52616B" />
      <Text style={{ flex: 1, color: INK, fontSize: 13, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color: MUTED, fontSize: 12 }}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('Alex Morgan');
  const [email, setEmail] = useState('alex.morgan@asonyx.ai');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [draftName, setDraftName] = useState(name);
  const [draftEmail, setDraftEmail] = useState(email);
  const [draftPhone, setDraftPhone] = useState(phone);

  const openEditor = () => {
    setDraftName(name);
    setDraftEmail(email);
    setDraftPhone(phone);
    setEditing(true);
  };

  const saveProfile = () => {
    if (draftName.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draftEmail.trim()) || draftPhone.replace(/\D/g, '').length < 7) {
      Alert.alert('Check your details', 'Enter a name, a valid email address, and a phone number with at least 7 digits.');
      return;
    }
    setName(draftName.trim());
    setEmail(draftEmail.trim());
    setPhone(draftPhone.trim());
    setEditing(false);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#EEF7FD' }}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18, paddingBottom: 28 }}>
        <Text style={{ color: INK, fontSize: 24, fontWeight: '800', marginBottom: 17 }}>Rider Profile</Text>

        <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, borderRadius: 21, alignItems: 'center', padding: 20, marginBottom: 18 }}>
          <View style={{ width: 92, height: 92, borderRadius: 46, borderWidth: 2, borderColor: TEAL, padding: 3, marginBottom: 10 }}>
            <Image source={require('../../assets/brand/rider-avatar.jpg')} resizeMode="cover" style={{ width: '100%', height: '100%', borderRadius: 42 }} />
          </View>
          <Text style={{ color: INK, fontSize: 20, fontWeight: '800' }}>{name}</Text>
          <Text style={{ color: TEAL, fontSize: 10, fontWeight: '800', letterSpacing: 0.9, marginTop: 4 }}>ASONYX TEST PILOT</Text>
          <Text style={{ color: MUTED, fontSize: 13, marginTop: 5 }}>{email}</Text>
          <TouchableOpacity onPress={openEditor} activeOpacity={0.8} style={{ marginTop: 13, borderWidth: 1, borderColor: '#BCE8E2', borderRadius: 20, backgroundColor: '#F0FBF9', paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Edit2 size={14} color={TEAL} />
            <Text style={{ color: TEAL, fontSize: 12, fontWeight: '800' }}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: '#52616B', fontSize: 12, fontWeight: '800', letterSpacing: 0.6, marginBottom: 9 }}>LIVE METRICS</Text>
        <View style={{ flexDirection: 'row', gap: 9, marginBottom: 19 }}>
          {[
            { value: '142', label: 'Rides' },
            { value: '84.5 h', label: 'Hours' },
            { value: '87 mph', label: 'Top speed' },
          ].map(metric => (
            <View key={metric.label} style={{ flex: 1, minHeight: 76, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: INK, fontSize: 17, fontWeight: '800' }}>{metric.value}</Text>
              <Text style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>{metric.label}</Text>
            </View>
          ))}
        </View>

        <Text style={{ color: '#52616B', fontSize: 12, fontWeight: '800', letterSpacing: 0.6, marginBottom: 9 }}>HELMET & ACCOUNT DETAILS</Text>
        <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, borderRadius: 17, paddingHorizontal: 14, paddingVertical: 3 }}>
          <DetailRow icon={IdCard} label="Rider ID" value="ASX-2024-99X" />
          <DetailRow icon={Phone} label="Phone Number" value={phone} />
          <DetailRow icon={Shield} label="Helmet Model" value="Asonyx X-1 Carbon" />
          <View style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Cpu size={18} color="#52616B" />
            <Text style={{ flex: 1, color: INK, fontSize: 13, fontWeight: '700' }}>OS Firmware</Text>
            <Text style={{ color: MUTED, fontSize: 12 }}>v2.4.1</Text>
            <View style={{ backgroundColor: TEAL, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 }}><Text style={{ color: '#FFFFFF', fontSize: 8, fontWeight: '800' }}>LATEST</Text></View>
          </View>
        </View>
        <Text style={{ color: '#81919A', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 14 }}>Metrics and helmet details are sample preview data. Profile edits are kept for this app session.</Text>
      </ScrollView>

      <Modal visible={editing} transparent animationType="slide" onRequestClose={() => setEditing(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#EEF7FD', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 }}>
              <Text style={{ color: INK, fontSize: 19, fontWeight: '800' }}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditing(false)} accessibilityLabel="Close profile editor"><X size={20} color={MUTED} /></TouchableOpacity>
            </View>
            {[
              { label: 'FULL NAME', value: draftName, change: setDraftName, keyboard: 'default' as const },
              { label: 'EMAIL ADDRESS', value: draftEmail, change: setDraftEmail, keyboard: 'email-address' as const },
              { label: 'PHONE NUMBER', value: draftPhone, change: setDraftPhone, keyboard: 'phone-pad' as const },
            ].map(field => (
              <View key={field.label} style={{ marginBottom: 12 }}>
                <Text style={{ color: '#52616B', fontSize: 10, fontWeight: '800', marginBottom: 5 }}>{field.label}</Text>
                <TextInput value={field.value} onChangeText={field.change} keyboardType={field.keyboard} autoCapitalize={field.keyboard === 'email-address' ? 'none' : 'words'} style={{ height: 47, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, borderRadius: 11, paddingHorizontal: 12, color: INK }} />
              </View>
            ))}
            <TouchableOpacity onPress={saveProfile} style={{ height: 49, borderRadius: 12, backgroundColor: '#24C6C9', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
              <Text style={{ color: '#08282A', fontWeight: '800' }}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
