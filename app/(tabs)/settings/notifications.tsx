import { useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Battery, MapIcon, ShieldAlert, Tag } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type NotificationKey = 'ride' | 'sos' | 'battery' | 'navigation' | 'product';

const ITEMS = [
  { key: 'ride', title: 'Ride and safety alerts', detail: 'Safety reminders during a ride', Icon: ShieldAlert },
  { key: 'sos', title: 'SOS status updates', detail: 'Local confirmation prompts for SOS setup', Icon: Bell },
  { key: 'battery', title: 'Low helmet battery', detail: 'Alert when a connected helmet reports low power', Icon: Battery },
  { key: 'navigation', title: 'Navigation updates', detail: 'Route and turn reminders', Icon: MapIcon },
  { key: 'product', title: 'Product and plan news', detail: 'Optional Asonyx product updates', Icon: Tag },
] as const;

export default function NotificationsScreen() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<Record<NotificationKey, boolean>>({
    ride: true,
    sos: true,
    battery: true,
    navigation: true,
    product: false,
  });

  const updatePreference = (key: NotificationKey, value: boolean) => {
    setEnabled(current => ({ ...current, [key]: value }));
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#EEF7FD' }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/settings')} accessibilityLabel="Back to settings" style={{ width: 40, height: 40, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#D8E5EC', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><ArrowLeft size={19} color="#17232C" /></TouchableOpacity>
        <Text style={{ color: '#17232C', fontSize: 24, fontWeight: '900' }}>Notifications</Text>
        <Text style={{ color: '#64748B', fontSize: 13, marginTop: 4, marginBottom: 18 }}>Choose which alerts you want in the Asonyx app.</Text>

        <View style={{ backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: '#D8E5EC', paddingHorizontal: 14 }}>
          {ITEMS.map(({ key, title, detail, Icon }, index) => (
            <View key={key} style={{ minHeight: 75, flexDirection: 'row', alignItems: 'center', borderBottomWidth: index === ITEMS.length - 1 ? 0 : 1, borderBottomColor: '#EDF1F4', gap: 11 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#E7F6F5', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color="#168F87" /></View>
              <View style={{ flex: 1 }}><Text style={{ color: '#17232C', fontSize: 13, fontWeight: '800' }}>{title}</Text><Text style={{ color: '#7B8992', fontSize: 10, lineHeight: 14, marginTop: 3 }}>{detail}</Text></View>
              <Switch value={enabled[key]} onValueChange={value => updatePreference(key, value)} trackColor={{ false: '#D9E2E7', true: '#5DC6BB' }} thumbColor="#FFF" />
            </View>
          ))}
        </View>
        <View style={{ marginTop: 14, padding: 13, backgroundColor: '#E4F3F4', borderRadius: 13 }}>
          <Text style={{ color: '#35575D', fontSize: 11, lineHeight: 16 }}>These preferences update on this device for this app session. This preview does not request push permission or send notifications; helmet alerts need a connected helmet.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
