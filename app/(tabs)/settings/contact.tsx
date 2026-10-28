import { useState } from 'react';
import {
  Alert, Linking, ScrollView, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { ArrowLeft, Mail, Phone, ChevronRight, MessageSquare, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = ['Helmet Issue', 'App Idea', 'General'];
const SUPPORT_PHONE_LABEL = '+1 (800) 555-ANYX';
const SUPPORT_PHONE_URL = 'tel:+18005552699';

export default function ContactScreen() {
  const router = useRouter();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = () => {
    if (message.trim().length < 5) {
      Alert.alert('Add a little more detail', 'Please enter at least 5 characters so your feedback is useful.');
      return;
    }
    setSubmitted(true);
    setMessage('');
    Alert.alert('Preview only', 'Your feedback is shown as submitted in this app session. It was not sent or saved to a server.');
  };

  const openUrl = (url: string) => Linking.openURL(url).catch(() => Alert.alert('Unavailable', 'No compatible app is available on this device.'));

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#EEF7FD' }}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/settings')} accessibilityLabel="Back to settings" style={{ width: 40, height: 40, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#C7D8E2', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={19} color="#17232C" /></TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#101820', fontSize: 24, fontWeight: '800' }}>Contact Us</Text>
            <Text style={{ color: '#52616B', fontSize: 14, marginTop: 4 }}>We’re here to help with every ride</Text>
          </View>
        </View>

        <Text style={{ color: '#17222A', fontSize: 14, fontWeight: '800', marginTop: 24, marginBottom: 10 }}>GET IN TOUCH</Text>
        <TouchableOpacity onPress={() => openUrl(SUPPORT_PHONE_URL)} style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: '#C7D8E2', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#E7F5F4', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}><Phone size={21} color="#198F87" /></View>
          <View style={{ flex: 1 }}><Text style={{ fontSize: 11, fontWeight: '700', color: '#91A0AA' }}>PHONE SUPPORT</Text><Text style={{ color: '#168F87', fontWeight: '800', fontSize: 16, marginTop: 2 }}>{SUPPORT_PHONE_LABEL}</Text><Text style={{ color: '#53636E', fontSize: 12, marginTop: 3 }}>Tap to open your phone app</Text></View>
          <ChevronRight size={19} color="#91A0AA" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openUrl('mailto:support@asonyxai.com')} style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: '#C7D8E2', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#E7F5F4', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}><Mail size={21} color="#198F87" /></View>
          <View style={{ flex: 1 }}><Text style={{ fontSize: 11, fontWeight: '700', color: '#91A0AA' }}>EMAIL SUPPORT</Text><Text style={{ color: '#168F87', fontWeight: '800', fontSize: 15, marginTop: 2 }}>support@asonyxai.com</Text><Text style={{ color: '#53636E', fontSize: 12, marginTop: 3 }}>Tap to open your email app</Text></View>
          <ChevronRight size={19} color="#91A0AA" />
        </TouchableOpacity>

        <Text style={{ color: '#17222A', fontSize: 14, fontWeight: '800', marginTop: 26, marginBottom: 10 }}>SEND FEEDBACK</Text>
        <View style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: '#C7D8E2', borderRadius: 18, padding: 16 }}>
          <Text style={{ color: '#52616B', fontSize: 11, fontWeight: '800', marginBottom: 9 }}>CATEGORY</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {CATEGORIES.map(item => {
              const active = category === item;
              return <TouchableOpacity key={item} onPress={() => setCategory(item)} style={{ borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: active ? '#198F87' : '#D4DEE4', backgroundColor: active ? '#E6F5F3' : '#FFF' }}><Text style={{ color: active ? '#168F87' : '#53636E', fontWeight: active ? '700' : '500', fontSize: 12 }}>{item}</Text></TouchableOpacity>;
            })}
          </View>
          <Text style={{ color: '#52616B', fontSize: 11, fontWeight: '800', marginBottom: 8 }}>YOUR MESSAGE</Text>
          <TextInput value={message} onChangeText={text => { setMessage(text); setSubmitted(false); }} placeholder="Describe your experience with the Asonyx smart helmet or suggest an improvement..." placeholderTextColor="#9AA8B1" multiline textAlignVertical="top" maxLength={1000} style={{ minHeight: 108, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#C7D8E2', borderRadius: 10, padding: 12, color: '#17222A', lineHeight: 20, fontSize: 14 }} />
          <Text style={{ color: '#91A0AA', fontSize: 11, textAlign: 'right', marginTop: 5 }}>{message.length}/1000</Text>
          <TouchableOpacity onPress={submitFeedback} style={{ height: 48, borderRadius: 12, backgroundColor: '#26C6C9', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {submitted ? <Check size={18} color="#08282A" /> : <MessageSquare size={18} color="#08282A" />}
            <Text style={{ color: '#08282A', fontWeight: '800', fontSize: 14 }}>{submitted ? 'Submitted this session' : 'Submit Feedback'}</Text>
          </TouchableOpacity>
          <Text style={{ color: '#7C8B95', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 10 }}>Feedback stays on this screen session. This preview does not send it anywhere.</Text>
        </View>
        <Text style={{ textAlign: 'center', color: '#91A0AA', fontSize: 10, letterSpacing: 0.3, marginTop: 28 }}>© 2026 ASONYX AI • LOCAL APP PREVIEW</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
