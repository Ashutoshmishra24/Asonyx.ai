import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#EEF7FD' }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/settings')} accessibilityLabel="Back to settings" style={{ width: 40, height: 40, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#D8E5EC', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><ArrowLeft size={19} color="#17232C" /></TouchableOpacity>
        <Text style={{ color: '#17232C', fontSize: 24, fontWeight: '900' }}>Privacy Policy & Terms</Text>
        <Text style={{ color: '#64748B', fontSize: 13, marginTop: 4, marginBottom: 18 }}>Information for this local app preview</Text>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1, borderColor: '#D8E5EC', padding: 16, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 }}><ShieldCheck size={18} color="#168F87" /><Text style={{ color: '#17232C', fontSize: 14, fontWeight: '900' }}>Privacy</Text></View>
          <Text style={{ color: '#64748B', fontSize: 12, lineHeight: 19 }}>This preview does not send your feedback, profile edits, selected settings or payment fields to an Asonyx server. Files deliberately imported to Document Vault are copied to this app’s private storage. You can review and delete those files in the vault.</Text>
        </View>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1, borderColor: '#D8E5EC', padding: 16, marginBottom: 12 }}>
          <Text style={{ color: '#17232C', fontSize: 14, fontWeight: '900', marginBottom: 7 }}>Preview terms</Text>
          <Text style={{ color: '#64748B', fontSize: 12, lineHeight: 19 }}>Prices, product availability, subscription plans, delivery details and helmet metrics shown in this app are demonstration content. The app does not take payment, create a purchase, dispatch a helmet or provide emergency response. Do not use this preview as a replacement for certified safety equipment or emergency services.</Text>
        </View>
        <Text style={{ color: '#91A0AA', fontSize: 10, lineHeight: 15 }}>© 2026 Asonyx AI · Local preview documentation</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
