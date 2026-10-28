import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, Modal, Alert,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { usePlan } from '../../../contexts/plan-context';
import {
  Monitor, Mic, Camera, Zap, Shield, User,
  Bell, Lock, Info, HelpCircle, ChevronRight,
  X, Check, CreditCard,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthErrorMessage, useAuth } from '../../../contexts/auth-context';

function SettingRow({
  icon: Icon, iconColor, iconBg, label, sublabel,
  hasSwitch, switchValue, onSwitchChange,
  hasChevron, onPress, badge,
}: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={hasSwitch ? 1 : 0.7}
      style={{
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
      }}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 11,
        backgroundColor: iconBg,
        alignItems: 'center', justifyContent: 'center', marginRight: 14,
      }}>
        <Icon size={18} color={iconColor} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>{label}</Text>
        {sublabel && <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{sublabel}</Text>}
      </View>
      {badge && (
        <View style={{ backgroundColor: '#00D1B2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 }}>
          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>{badge}</Text>
        </View>
      )}
      {hasSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#E2E8F0', true: '#00D1B2' }}
          thumbColor="#FFF"
        />
      )}
      {hasChevron && <ChevronRight size={16} color="#94A3B8" />}
    </TouchableOpacity>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: '#FFF', borderRadius: 20, marginHorizontal: 20,
      marginBottom: 16, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6,
      borderWidth: 1.5, borderColor: '#E2E8F0',
      shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 1, paddingTop: 12, paddingBottom: 4 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { selectedPlanId, isPlanLoaded } = usePlan();
  const { signOutUser } = useAuth();
  const [hud, setHud] = useState(false);
  const [voiceAssist, setVoiceAssist] = useState(false);
  const [autoSos, setAutoSos] = useState(false);
  const [distanceModal, setDistanceModal] = useState(false);
  const [speedModal, setSpeedModal] = useState(false);
  const [selectedDist, setSelectedDist] = useState('Medium 15m');
  const [selectedSpeed, setSelectedSpeed] = useState(120);

  const distOptions = ['Low 5m', 'Medium 15m', 'High 30m'];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#EEF7FD' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ paddingTop: 18, paddingBottom: 12, paddingHorizontal: 20 }}>
          <Text style={{ color: '#15222B', fontSize: 24, fontWeight: '800' }}>Settings</Text>
          <Text style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>Local controls for your app preview</Text>
        </View>

        <TouchableOpacity onPress={() => router.push('/settings/pricing' as Href)} activeOpacity={0.85} accessibilityRole="link" accessibilityLabel="Open Plans and Pricing" style={{ marginHorizontal: 20, marginBottom: 17, padding: 14, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#D8E5EC', flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#E4F5F3', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><CreditCard size={19} color="#168F87" /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#15222B', fontSize: 14, fontWeight: '800' }}>Plans & Pricing</Text>
              <Text style={{ color: '#64748B', fontSize: 11, marginTop: 3 }}>{isPlanLoaded ? `Current plan: ${selectedPlanId.charAt(0).toUpperCase()}${selectedPlanId.slice(1)} · Compare plans` : 'Compare Free, Basic and Pro plans'}</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Helmet Config */}
        <SectionCard title="HELMET CONFIGURATION">
          <SettingRow
            icon={Monitor} iconColor="#3B82F6" iconBg="#EFF6FF"
            label="HUD Active Display"
            sublabel="Heads-up visual navigation overlay"
            hasSwitch switchValue={hud} onSwitchChange={setHud}
          />
          <SettingRow
            icon={Mic} iconColor="#8B5CF6" iconBg="#F5F3FF"
            label="AI Voice Assistant"
            sublabel="Speech recognition integration unavailable"
            hasSwitch switchValue={voiceAssist} onSwitchChange={setVoiceAssist}
          />
          <SettingRow
            icon={Camera} iconColor="#EC4899" iconBg="#FDF2F8"
            label="Camera Warning Distance"
            sublabel={selectedDist}
            hasChevron onPress={() => setDistanceModal(true)}
          />
          <SettingRow
            icon={Zap} iconColor="#F59E0B" iconBg="#FFFBEB"
            label="Speed Alert Threshold"
            sublabel={`${selectedSpeed} km/h`}
            hasChevron onPress={() => setSpeedModal(true)}
          />
          <SettingRow
            icon={Shield} iconColor="#EF4444" iconBg="#FEF2F2"
            label="Auto SOS Detection"
            sublabel="Requires helmet impact sensors and contact"
            hasSwitch switchValue={autoSos} onSwitchChange={setAutoSos}
          />
        </SectionCard>

        {/* General Settings */}
        <SectionCard title="GENERAL">
          <SettingRow
            icon={User} iconColor="#00D1B2" iconBg="rgba(0,209,178,0.1)"
            label="Account Preferences"
            sublabel="Edit your rider details"
            hasChevron onPress={() => router.push('/profile' as Href)}
          />
          <SettingRow
            icon={Bell} iconColor="#F59E0B" iconBg="#FFFBEB"
            label="Notifications"
            sublabel="Choose which app alerts are enabled"
            hasChevron onPress={() => router.push('/settings/notifications' as Href)}
          />
          <SettingRow
            icon={Lock} iconColor="#64748B" iconBg="#F8FAFC"
            label="Privacy & Security"
            sublabel="Review local data and privacy controls"
            hasChevron onPress={() => router.push('/settings/privacy' as Href)}
          />
          <SettingRow
            icon={Info} iconColor="#3B82F6" iconBg="#EFF6FF"
            label="About Asonyx AI"
            sublabel="App information and support links"
            hasChevron onPress={() => router.push('/settings/about' as Href)}
          />
          <SettingRow
            icon={HelpCircle} iconColor="#10B981" iconBg="#ECFDF5"
            label="Help Center"
            sublabel="Troubleshooting and local guides"
            hasChevron onPress={() => router.push('/settings/help' as Href)}
          />
          <SettingRow
            icon={HelpCircle} iconColor="#10B981" iconBg="#ECFDF5"
            label="Contact Us"
            sublabel="Feedback and support options"
            hasChevron onPress={() => router.push('/settings/contact' as Href)}
          />
        </SectionCard>

        {/* Danger zone */}
        <TouchableOpacity onPress={() => Alert.alert('Sign out?', 'You will need to sign in again to access your account.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: async () => {
            try {
              await signOutUser();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Could not sign out', getAuthErrorMessage(error));
            }
          } },
        ])} style={{
          marginHorizontal: 20, backgroundColor: '#FEF2F2',
          borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#FECACA',
          alignItems: 'center',
        }}>
          <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 }}>Sign Out of Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Distance Modal */}
      <Modal visible={distanceModal} transparent animationType="slide" onRequestClose={() => setDistanceModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#F4FAF8', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Camera Warning Distance</Text>
              <TouchableOpacity onPress={() => setDistanceModal(false)} style={{ padding: 8, borderRadius: 10, backgroundColor: '#E2E8F0' }}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            {distOptions.map(opt => (
              <TouchableOpacity
                key={opt}
                onPress={() => { setSelectedDist(opt); setDistanceModal(false); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  padding: 16, borderRadius: 14, marginBottom: 10,
                  backgroundColor: selectedDist === opt ? 'rgba(0,209,178,0.1)' : '#FFF',
                  borderWidth: 1.5,
                  borderColor: selectedDist === opt ? '#00D1B2' : '#E2E8F0',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>{opt}</Text>
                {selectedDist === opt && <Check size={18} color="#00D1B2" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Speed Modal */}
      <Modal visible={speedModal} transparent animationType="slide" onRequestClose={() => setSpeedModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#F4FAF8', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Speed Alert Threshold</Text>
              <TouchableOpacity onPress={() => setSpeedModal(false)} style={{ padding: 8, borderRadius: 10, backgroundColor: '#E2E8F0' }}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={{ textAlign: 'center', fontSize: 48, fontWeight: '900', color: '#00D1B2', marginBottom: 8 }}>{selectedSpeed}</Text>
            <Text style={{ textAlign: 'center', color: '#64748B', marginBottom: 24 }}>km/h</Text>
            {[80, 100, 120, 140, 160].map(speed => (
              <TouchableOpacity
                key={speed}
                onPress={() => { setSelectedSpeed(speed); setSpeedModal(false); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  padding: 14, borderRadius: 12, marginBottom: 8,
                  backgroundColor: selectedSpeed === speed ? 'rgba(0,209,178,0.1)' : '#FFF',
                  borderWidth: 1.5,
                  borderColor: selectedSpeed === speed ? '#00D1B2' : '#E2E8F0',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>{speed} km/h</Text>
                {selectedSpeed === speed && <Check size={18} color="#00D1B2" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
