import { useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Linking, Modal, Platform, ScrollView, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Directory, File, Paths } from 'expo-file-system';
import { useRouter, type Href } from 'expo-router';
import {
  AlertTriangle, Battery, Bluetooth, Camera, ChevronRight, CreditCard,
  MapPin, Mic, Shield, SwitchCamera, Wind, X,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FeatureId = 'bluetooth' | 'sos' | 'alcohol' | 'camera' | 'gps' | 'voice' | 'battery' | 'more';
const INK = '#18232B';
const TEAL = '#24C6C9';
const MUTED = '#667783';
const BORDER = '#D7E4EA';
const HELMET_BATTERY_PERCENT = 82;

function getVaultDirectory() {
  return Platform.OS === 'web' ? null : new Directory(Paths.document, 'asonyx-vault');
}

function PhoneCameraPanel() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const capturePhoto = async () => {
    try {
      if (!cameraRef.current || !cameraReady) {
        Alert.alert('Camera starting', 'Wait a moment for the phone camera preview to load.');
        return;
      }
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.88 });
      setPhotoUri(photo.uri);
    } catch {
      Alert.alert('Photo not captured', 'Check that camera access is available, then try again.');
    }
  };

  const savePhoto = async () => {
    if (!photoUri) return;
    try {
      setSaving(true);
      const vaultDirectory = getVaultDirectory();
      if (!vaultDirectory) {
        Alert.alert('Save unavailable', 'The Document Vault is available in the Android and iOS app.');
        return;
      }
      if (!vaultDirectory.exists) vaultDirectory.create({ intermediates: true, idempotent: true });
      const fileName = `Ride photo ${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
      const destination = new File(vaultDirectory, fileName);
      await new File(photoUri).copy(destination);
      setCameraReady(false);
      setPhotoUri(null);
      Alert.alert('Saved to Document Vault', 'The photo is stored on this device.');
    } catch {
      Alert.alert('Could not save photo', 'The image could not be copied to the local Document Vault.');
    } finally {
      setSaving(false);
    }
  };

  if (!permission) {
    return <View style={{ minHeight: 220, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={TEAL} /><Text style={{ color: MUTED, fontSize: 12, marginTop: 9 }}>Checking camera permission…</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 18, alignItems: 'center' }}>
        <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: '#E7F8F7', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}><Camera size={26} color={TEAL} /></View>
        <Text style={{ color: INK, fontSize: 16, fontWeight: '800', textAlign: 'center' }}>Use this phone’s camera</Text>
        <Text style={{ color: MUTED, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6, marginBottom: 14 }}>Asonyx AI will ask for camera permission. Photos are only taken when you tap Capture and are not uploaded.</Text>
        <TouchableOpacity onPress={() => permission.canAskAgain ? requestPermission() : Linking.openSettings()} style={{ backgroundColor: TEAL, borderRadius: 12, minHeight: 44, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#073536', fontWeight: '800' }}>{permission.canAskAgain ? 'Allow Camera Access' : 'Open App Settings'}</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <Text style={{ color: MUTED, fontSize: 12, lineHeight: 17, marginBottom: 10 }}>Phone camera preview for now. Captures are still photos; video and helmet camera connection are not active.</Text>
      <View style={{ height: 275, overflow: 'hidden', borderRadius: 16, backgroundColor: '#071A20', borderWidth: 1, borderColor: BORDER }}>
        {photoUri ? <Image source={{ uri: photoUri }} resizeMode="cover" style={{ width: '100%', height: '100%' }} /> : <CameraView ref={cameraRef} facing={facing} mode="picture" onCameraReady={() => setCameraReady(true)} onMountError={() => Alert.alert('Camera unavailable', 'The phone camera could not start. Close other camera apps and try again.')} style={{ flex: 1 }} />}
      </View>
      {photoUri ? (
        <View style={{ flexDirection: 'row', gap: 9, marginTop: 11 }}>
          <TouchableOpacity onPress={() => { setCameraReady(false); setPhotoUri(null); }} style={{ flex: 1, minHeight: 45, borderRadius: 12, borderWidth: 1, borderColor: BORDER, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: INK, fontWeight: '800' }}>Retake</Text></TouchableOpacity>
          <TouchableOpacity disabled={saving} onPress={savePhoto} style={{ flex: 1, minHeight: 45, borderRadius: 12, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.65 : 1 }}><Text style={{ color: '#073536', fontWeight: '800' }}>{saving ? 'Saving…' : 'Save to Vault'}</Text></TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 11 }}>
          <TouchableOpacity onPress={() => { setCameraReady(false); setFacing(current => current === 'back' ? 'front' : 'back'); }} accessibilityLabel="Switch camera" style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#E7F8F7', alignItems: 'center', justifyContent: 'center' }}><SwitchCamera size={21} color={TEAL} /></TouchableOpacity>
          <TouchableOpacity onPress={capturePhoto} accessibilityLabel="Capture photo" style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 4, borderColor: '#C9EFEC', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: TEAL }} /></TouchableOpacity>
          <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: MUTED, fontSize: 9, fontWeight: '800' }}>PHOTO</Text></View>
        </View>
      )}
    </View>
  );
}

const FEATURES: { id: FeatureId; title: string; detail: string; Icon: typeof Bluetooth; color: string }[] = [
  { id: 'bluetooth', title: 'Bluetooth Connectivity', detail: 'Pairing requires a supported helmet', Icon: Bluetooth, color: '#32BFC2' },
  { id: 'sos', title: 'SOS Emergency Number', detail: 'Set your emergency contact', Icon: AlertTriangle, color: '#D5AE59' },
  { id: 'alcohol', title: 'Alcohol Level', detail: 'Breath sensor hardware required', Icon: Wind, color: '#32BFC2' },
  { id: 'camera', title: 'Camera', detail: 'Use this phone for safety photos', Icon: Camera, color: '#32BFC2' },
  { id: 'gps', title: 'GPS Navigation', detail: 'Get directions from your current location', Icon: MapPin, color: '#32BFC2' },
  { id: 'voice', title: 'Voice Assistant', detail: 'Try an offline text command', Icon: Mic, color: '#32BFC2' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [destination, setDestination] = useState('');
  const [voiceText, setVoiceText] = useState('');
  const [voiceReply, setVoiceReply] = useState('');
  const [contactSaved, setContactSaved] = useState(false);

  const feature = FEATURES.find(item => item.id === activeFeature);

  const runVoiceCommand = () => {
    const command = voiceText.trim();
    if (!command) return;
    const normalized = command.toLowerCase();
    if (normalized.includes('help') || normalized.includes('sos')) {
      setVoiceReply('Open SOS Emergency to add a contact. This preview does not place calls.');
    } else if (normalized.includes('navigation') || normalized.includes('route')) {
      setVoiceReply('Open GPS Navigation, enter your destination, and start directions in your phone’s Maps app.');
    } else if (normalized.includes('camera') || normalized.includes('record')) {
      setVoiceReply('Open Built-in AI Camera to capture a safety photo with this phone. Helmet camera connection is not active.');
    } else {
      setVoiceReply('Try a local command: “help”, “open navigation”, or “camera status”. No microphone is used.');
    }
  };

  const startNavigation = async () => {
    const target = destination.trim();
    if (!target) {
      Alert.alert('Add a destination', 'Enter a place or address to open turn-by-turn directions.');
      return;
    }

    const encodedTarget = encodeURIComponent(target);
    const mapUrls = Platform.OS === 'ios'
      ? [`http://maps.apple.com/?daddr=${encodedTarget}&dirflg=d`, `https://www.google.com/maps/dir/?api=1&destination=${encodedTarget}`]
      : [`google.navigation:q=${encodedTarget}&mode=d`, `geo:0,0?q=${encodedTarget}`];

    for (const url of mapUrls) {
      try {
        await Linking.openURL(url);
        return;
      } catch {
        // Try the device's other standard map URL before showing an error.
      }
    }
    Alert.alert('Maps not available', 'Install or enable a Maps app on this device, then try again.');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#EEF7FD' }}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <View>
            <Text style={{ color: INK, fontSize: 23, fontWeight: '800' }}>Smart Features</Text>
            <Text style={{ color: MUTED, fontSize: 13, marginTop: 3 }}>Tactical tools designed for your helmet</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings/pricing' as Href)} accessibilityRole="link" accessibilityLabel="Open Plans and Pricing" style={{ width: 42, height: 42, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={19} color="#168F87" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setActiveFeature('camera')} activeOpacity={0.9} style={{ backgroundColor: '#FFF', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <View style={{ alignSelf: 'flex-start', backgroundColor: '#DFF7F5', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginBottom: 7 }}><Text style={{ color: '#168D8F', fontSize: 10, fontWeight: '800' }}>FEATURED</Text></View>
            <Text style={{ color: INK, fontSize: 16, fontWeight: '800' }}>Built-in AI Camera</Text>
            <Text style={{ color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 4 }}>Use this phone’s camera to capture a safety photo while helmet camera hardware is unavailable.</Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {['4K', 'Real-time AI', 'Hazard alerts'].map(tag => <Text key={tag} style={{ color: '#147E80', backgroundColor: '#E9F8F7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4, fontSize: 10, fontWeight: '700' }}>{tag}</Text>)}
            </View>
          </View>
          <View style={{ width: 64, height: 64, borderRadius: 32, overflow: 'hidden', borderWidth: 2, borderColor: '#D7F1F0' }}>
            <Image source={require('../../assets/brand/feature-camera.jpg')} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveFeature('battery')} activeOpacity={0.85} style={{ minHeight: 66, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 11 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#E7F8F7', alignItems: 'center', justifyContent: 'center' }}><Battery size={21} color="#168F87" strokeWidth={2.2} /></View>
          <View style={{ flex: 1 }}><Text style={{ color: INK, fontSize: 13, fontWeight: '800' }}>Helmet Battery Level</Text><Text style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>Battery status preview</Text></View>
          <Text style={{ color: '#168F87', fontSize: 16, fontWeight: '900' }}>{HELMET_BATTERY_PERCENT}%</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
          {FEATURES.slice(0, 4).map(item => {
            const Icon = item.Icon;
            return (
              <TouchableOpacity key={item.id} onPress={() => setActiveFeature(item.id)} activeOpacity={0.85} style={{ width: '48%', minHeight: 102, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 12 }}>
                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#E7F8F7', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}><Icon size={17} color={item.color} /></View>
                <Text style={{ color: INK, fontSize: 12, fontWeight: '800' }}>{item.title}</Text>
                <Text style={{ color: MUTED, fontSize: 10, lineHeight: 14, marginTop: 3 }}>{item.detail}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {FEATURES.slice(4).map(item => {
          const Icon = item.Icon;
          return <TouchableOpacity key={item.id} onPress={() => setActiveFeature(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#FFF', borderRadius: 13, padding: 12, marginTop: 9, borderWidth: 1, borderColor: BORDER }}>
            <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#E7F8F7', alignItems: 'center', justifyContent: 'center' }}><Icon size={17} color={item.color} /></View>
            <View style={{ flex: 1 }}><Text style={{ color: INK, fontSize: 12, fontWeight: '800' }}>{item.title}</Text><Text style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>{item.detail}</Text></View>
            <ChevronRight size={16} color="#9AA9B2" />
          </TouchableOpacity>;
        })}

        <TouchableOpacity onPress={() => setActiveFeature('more')} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, borderRadius: 13, backgroundColor: '#E7F8F7', padding: 12 }}>
          <Shield size={16} color="#168D8F" />
          <Text style={{ color: '#255F61', fontSize: 12, fontWeight: '700', marginLeft: 8, flex: 1 }}>Explore 5 more tactical systems</Text>
          <ChevronRight size={15} color="#168D8F" />
        </TouchableOpacity>
        <Text style={{ color: '#83939D', fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 13 }}>Local app preview. Navigation opens your installed Maps app; helmet sensors, helmet camera, voice recognition and emergency dispatch are not connected.</Text>
      </ScrollView>

      <Modal visible={activeFeature !== null} transparent animationType="slide" onRequestClose={() => setActiveFeature(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.48)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#F3F9FC', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: INK, fontSize: 18, fontWeight: '800' }}>{activeFeature === 'more' ? 'Tactical Systems' : activeFeature === 'camera' ? 'Mobile Camera' : feature?.title}</Text>
              <TouchableOpacity onPress={() => setActiveFeature(null)} accessibilityLabel="Close"><X size={20} color={MUTED} /></TouchableOpacity>
            </View>
            {activeFeature === 'bluetooth' && <>
              <Text style={{ color: MUTED, fontSize: 14, lineHeight: 21 }}>Bluetooth pairing is not available yet because this project does not include the helmet Bluetooth hardware integration. No nearby devices are being scanned.</Text>
              <View style={{ marginTop: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 9 }}><Bluetooth size={18} color={TEAL} /><Text style={{ color: INK, fontWeight: '700', fontSize: 13 }}>No helmet connected</Text></View>
            </>}
            {activeFeature === 'battery' && <>
              <View style={{ alignItems: 'center', paddingVertical: 18 }}><Battery size={46} color={TEAL} strokeWidth={2} /><Text style={{ color: TEAL, fontSize: 30, fontWeight: '900', marginTop: 10 }}>{HELMET_BATTERY_PERCENT}%</Text><Text style={{ color: INK, fontSize: 17, fontWeight: '800', marginTop: 3 }}>Helmet battery</Text></View>
              <View style={{ height: 10, backgroundColor: '#E3ECEF', borderRadius: 6, overflow: 'hidden', marginBottom: 11 }}><View style={{ width: `${HELMET_BATTERY_PERCENT}%`, height: '100%', backgroundColor: TEAL, borderRadius: 6 }} /></View>
              <Text style={{ color: MUTED, fontSize: 12, lineHeight: 18, textAlign: 'center' }}>82% is a preview value. Live battery readings will appear when a supported helmet is connected.</Text>
            </>}
            {activeFeature === 'sos' && <>
              <Text style={{ color: '#8C5C36', backgroundColor: '#FFF7E8', borderRadius: 10, padding: 12, lineHeight: 18, fontSize: 12, marginBottom: 14 }}>SOS contact is saved only in this screen session. This preview will not place calls or send messages.</Text>
              <Text style={{ color: MUTED, fontSize: 11, fontWeight: '700', marginBottom: 6 }}>EMERGENCY CONTACT</Text>
              <TextInput value={emergencyContact} onChangeText={text => { setEmergencyContact(text); setContactSaved(false); }} placeholder="Enter phone number" placeholderTextColor="#91A0AA" keyboardType="phone-pad" style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 13, borderWidth: 1, borderColor: BORDER, color: INK, marginBottom: 10 }} />
              <TouchableOpacity onPress={() => {
                if (emergencyContact.replace(/\D/g, '').length < 7) { Alert.alert('Check the number', 'Enter at least 7 digits to save a contact.'); return; }
                setContactSaved(true);
                Alert.alert('Saved for this session', 'This preview will not call or message the saved number.');
              }} style={{ backgroundColor: TEAL, borderRadius: 12, padding: 13, alignItems: 'center' }}><Text style={{ color: '#073536', fontWeight: '800' }}>{contactSaved ? 'Contact Saved' : 'Save Contact'}</Text></TouchableOpacity>
            </>}
            {activeFeature === 'alcohol' && <>
              <View style={{ alignItems: 'center', paddingVertical: 16 }}><Wind size={38} color="#C39B43" /><Text style={{ color: INK, fontSize: 19, fontWeight: '800', marginTop: 12 }}>Sensor unavailable</Text></View>
              <Text style={{ color: MUTED, fontSize: 13, lineHeight: 20, textAlign: 'center' }}>This phone cannot measure alcohol level. A supported breath sensor and helmet integration are required. No BAC value or ride safety status is available.</Text>
            </>}
            {activeFeature === 'camera' && <PhoneCameraPanel />}
            {activeFeature === 'gps' && <>
              <Text style={{ color: MUTED, fontSize: 13, marginBottom: 7 }}>Destination</Text>
              <TextInput value={destination} onChangeText={setDestination} placeholder="Enter a place or address" placeholderTextColor="#91A0AA" returnKeyType="go" onSubmitEditing={startNavigation} style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: BORDER, borderRadius: 12, height: 48, paddingHorizontal: 12, color: INK }} />
              <TouchableOpacity onPress={startNavigation} style={{ backgroundColor: TEAL, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 10 }}><Text style={{ color: '#073536', fontWeight: '800' }}>Navigate with Maps</Text></TouchableOpacity>
              <Text style={{ color: MUTED, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 9 }}>Directions start from your current phone GPS location. Allow location access in Maps if it asks.</Text>
            </>}
            {activeFeature === 'voice' && <>
              <Text style={{ color: MUTED, fontSize: 13, lineHeight: 19, marginBottom: 11 }}>Try text commands offline. This does not access the microphone or speech recognition.</Text>
              <TextInput value={voiceText} onChangeText={text => { setVoiceText(text); setVoiceReply(''); }} placeholder="Type: help, navigation, camera status" placeholderTextColor="#91A0AA" onSubmitEditing={runVoiceCommand} returnKeyType="send" style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: BORDER, borderRadius: 12, height: 48, paddingHorizontal: 12, color: INK }} />
              <TouchableOpacity onPress={runVoiceCommand} style={{ backgroundColor: TEAL, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 10 }}><Text style={{ color: '#073536', fontWeight: '800' }}>Run Text Command</Text></TouchableOpacity>
              {!!voiceReply && <Text style={{ color: MUTED, lineHeight: 19, marginTop: 10 }}>{voiceReply}</Text>}
            </>}
            {activeFeature === 'more' && <Text style={{ color: MUTED, fontSize: 13, lineHeight: 20 }}>Additional safety features will appear here when the relevant helmet sensors, permissions, and local integrations are available. No sensor readings are simulated.</Text>}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
