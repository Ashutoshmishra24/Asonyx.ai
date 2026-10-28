import { useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Linking, Modal, Platform,
  ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { ArrowLeft, MessageSquare, Minus, Phone, Plus, Search, Send, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const FAQS = [
  { question: 'How to pair helmet via Bluetooth?', answer: 'Turn on your Asonyx helmet and keep it nearby. Bluetooth pairing requires a supported helmet; this app preview does not scan for devices yet.' },
  { question: 'How does SOS emergency work?', answer: 'An SOS workflow needs a connected helmet, location permission and a configured emergency contact. No call or message is sent from this preview.' },
  { question: 'How to set up crash detection?', answer: 'Crash detection needs supported helmet sensors and a native device connection. The setting shown here is a design preview and does not monitor impacts.' },
  { question: 'How to use voice commands?', answer: 'Voice control needs microphone and speech recognition integration. You can explore the settings, but this preview does not listen to or record audio.' },
];

const SUPPORT_PHONE_URL = 'tel:+18005552699';

function openContactUrl(url: string) {
  Linking.openURL(url).catch(() => Alert.alert('Unavailable', 'No compatible app is available on this device.'));
}

export default function HelpScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLines, setChatLines] = useState<string[]>(['Asonyx offline help is ready. Choose a guide or type Bluetooth, SOS, crash detection, or voice.']);
  const filteredFaqs = useMemo(() => FAQS.filter(item =>
    `${item.question} ${item.answer}`.toLowerCase().includes(search.trim().toLowerCase())
  ), [search]);

  const replyToChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    const faq = FAQS.find(item => item.question.toLowerCase().includes(text.toLowerCase()) || item.answer.toLowerCase().includes(text.toLowerCase()));
    setChatLines(lines => [...lines, `You: ${text}`, `Guide: ${faq?.answer ?? 'I can help with Bluetooth pairing, SOS setup, crash detection, and voice commands. Select a FAQ above for details.'}`]);
    setChatInput('');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#EEF7FD' }}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/settings')} accessibilityLabel="Back to settings" style={{ width: 40, height: 40, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#C7D8E2', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={19} color="#17232C" /></TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#101820', fontSize: 24, fontWeight: '800' }}>Help Center</Text>
            <Text style={{ color: '#52616B', fontSize: 14, marginTop: 4 }}>24/7 intelligent crew support</Text>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: '#C7D8E2', marginTop: 12, marginBottom: 22 }} />

        <View style={{ height: 96 }} />
        <View style={{ backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#C7D8E2', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 20 }}>
          <Search size={18} color="#8A9AA5" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search troubleshooting guides..." placeholderTextColor="#91A0AA" style={{ flex: 1, height: 48, marginLeft: 10, color: '#13202A', fontSize: 14 }} returnKeyType="search" />
          {!!search && <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Clear search"><X size={16} color="#778791" /></TouchableOpacity>}
        </View>

        <Text style={{ color: '#B99B56', fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 }}>FAQ TOPICS</Text>
        {filteredFaqs.map((faq) => {
          const index = FAQS.indexOf(faq);
          const isOpen = expanded === index;
          return (
            <View key={faq.question} style={{ backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#C7D8E2', marginBottom: 9, overflow: 'hidden' }}>
              <TouchableOpacity onPress={() => setExpanded(isOpen ? null : index)} accessibilityRole="button" accessibilityState={{ expanded: isOpen }} style={{ minHeight: 48, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ flex: 1, color: '#16212A', fontWeight: '700', fontSize: 14 }}>{faq.question}</Text>
                {isOpen ? <Minus size={17} color="#26C6C9" /> : <Plus size={17} color="#26C6C9" />}
              </TouchableOpacity>
              {isOpen && <Text style={{ paddingHorizontal: 12, paddingBottom: 13, color: '#53636E', lineHeight: 20, fontSize: 13 }}>{faq.answer}</Text>}
            </View>
          );
        })}
        {filteredFaqs.length === 0 && <Text style={{ color: '#64748B', paddingVertical: 14 }}>No guides match “{search}”. Try Bluetooth, SOS, camera, or voice.</Text>}

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
          <TouchableOpacity onPress={() => setChatVisible(true)} style={{ flex: 1, minHeight: 100, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#C7D8E2', borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 12 }}>
            <MessageSquare size={22} color="#26C6C9" />
            <Text style={{ color: '#111B23', fontWeight: '800', fontSize: 14, marginTop: 8 }}>Live Chat</Text>
            <Text style={{ color: '#65747E', fontSize: 11, marginTop: 4, textAlign: 'center' }}>Instant local answers</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openContactUrl(SUPPORT_PHONE_URL)} style={{ flex: 1, minHeight: 100, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#C7D8E2', borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 12 }}>
            <Phone size={22} color="#B99B56" />
            <Text style={{ color: '#111B23', fontWeight: '800', fontSize: 14, marginTop: 8 }}>Call Support</Text>
            <Text style={{ color: '#65747E', fontSize: 11, marginTop: 4, textAlign: 'center' }}>Opens your phone app</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => openContactUrl('mailto:support@asonyxai.com')} style={{ alignSelf: 'center', marginTop: 18, padding: 10 }}>
          <Text style={{ color: '#168F91', fontWeight: '700', fontSize: 13 }}>Email support@asonyxai.com</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={chatVisible} animationType="slide" transparent onRequestClose={() => setChatVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.55)' }}>
          <View style={{ maxHeight: '82%', backgroundColor: '#EEF7FD', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#15222B' }}>Asonyx Help Chat</Text>
              <TouchableOpacity onPress={() => setChatVisible(false)} accessibilityLabel="Close guide"><X size={20} color="#52616B" /></TouchableOpacity>
            </View>
            <ScrollView style={{ minHeight: 150 }} contentContainerStyle={{ gap: 10 }}>
              {chatLines.map((line, i) => <Text key={`${i}-${line}`} style={{ color: '#344651', backgroundColor: '#FFF', padding: 12, borderRadius: 12, overflow: 'hidden', lineHeight: 20 }}>{line}</Text>)}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TextInput value={chatInput} onChangeText={setChatInput} placeholder="Ask about helmet setup..." placeholderTextColor="#91A0AA" onSubmitEditing={replyToChat} style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#C7D8E2', paddingHorizontal: 12, height: 46, color: '#13202A' }} />
              <TouchableOpacity onPress={replyToChat} accessibilityLabel="Send question" style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: '#26C6C9', alignItems: 'center', justifyContent: 'center' }}><Send size={18} color="#FFF" /></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
