import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, Headphones, ShieldCheck, Tag } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const router = useRouter();
  const links = [
    { label: 'Help Center', detail: 'Troubleshooting guides and local support', Icon: BookOpen, route: '/settings/help' as const },
    { label: 'Contact Us', detail: 'Contact options and feedback form', Icon: Headphones, route: '/settings/contact' as const },
    { label: 'Plans & Pricing', detail: 'Compare Free, Basic and Pro', Icon: Tag, route: '/settings/pricing' as const },
  ];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#EEF7FD' }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/settings')} accessibilityLabel="Back to settings" style={{ width: 40, height: 40, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#D8E5EC', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><ArrowLeft size={19} color="#17232C" /></TouchableOpacity>
        <Text style={{ color: '#17232C', fontSize: 24, fontWeight: '900' }}>About Asonyx AI</Text>
        <Text style={{ color: '#64748B', fontSize: 13, marginTop: 4, marginBottom: 18 }}>Smart helmet companion</Text>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#D8E5EC', padding: 20, alignItems: 'center', marginBottom: 14 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: '#E3F5F3', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}><ShieldCheck size={32} color="#168F87" /></View>
          <Text style={{ color: '#17232C', fontSize: 19, fontWeight: '900' }}>ASONYX AI</Text>
          <Text style={{ color: '#168F87', fontSize: 11, fontWeight: '800', letterSpacing: 1.1, marginTop: 3 }}>SMART HELMET INTELLIGENCE</Text>
          <Text style={{ color: '#64748B', fontSize: 12, marginTop: 12 }}>App version 1.0.0 · Local preview</Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#D8E5EC', padding: 15, marginBottom: 14 }}>
          <Text style={{ color: '#17232C', fontSize: 14, fontWeight: '900', marginBottom: 6 }}>About this app</Text>
          <Text style={{ color: '#64748B', fontSize: 12, lineHeight: 18 }}>Asonyx AI brings helmet setup, riding tools, a document vault, rider settings and product information together in one place. Device hardware, cloud accounts, live support and subscriptions are not connected in this preview.</Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#D8E5EC', paddingHorizontal: 14 }}>
          {links.map(({ label, detail, Icon, route }, index) => <TouchableOpacity key={label} onPress={() => router.push(route)} style={{ minHeight: 65, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: index === links.length - 1 ? 0 : 1, borderBottomColor: '#EDF1F4' }}><Icon size={18} color="#168F87" /><View style={{ flex: 1 }}><Text style={{ color: '#17232C', fontSize: 13, fontWeight: '800' }}>{label}</Text><Text style={{ color: '#7B8992', fontSize: 10, marginTop: 3 }}>{detail}</Text></View><Text style={{ color: '#168F87', fontSize: 20 }}>›</Text></TouchableOpacity>)}
        </View>
        <Text style={{ textAlign: 'center', color: '#91A0AA', fontSize: 10, marginTop: 18 }}>© 2026 Asonyx AI</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
