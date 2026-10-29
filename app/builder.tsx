import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, type ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Plus, ShoppingCart } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRODUCT_IMAGES: Record<string, ImageSourcePropType> = {
  '1': require('../assets/brand/helmet-detail-pro.jpg'),
  '2': require('../assets/brand/helmet-detail-urban.jpg'),
  '3': require('../assets/brand/helmet-detail-sport.jpg'),
  '4': require('../assets/brand/helmet-detail-touring.jpg'),
};

const ADDONS = [
  { id: 'camera', label: 'Camera', description: '4K action camera with wide-angle lens and built-in mounting.', price: 2499, image: require('../assets/brand/feature-camera.jpg') },
  { id: 'storage', label: 'Storage', description: 'Integrated shell compartment for small essentials and charging cables.', price: 1299, image: require('../assets/brand/feature-storage.jpg') },
  { id: 'audio', label: 'Sound System', description: 'Premium audio speakers with voice assistant support and clear call quality.', price: 2999, image: require('../assets/brand/feature-sound.jpg') },
  { id: 'brake', label: 'Rear Lighting', description: 'Smart brake light and visibility strip for improved rider safety.', price: 1499, image: require('../assets/brand/feature-lighting.jpg') },
  { id: 'hud', label: 'Turn-by-Turn Nav', description: 'Voice-guided directions projected onto the visor for safer riding.', price: 1999, image: require('../assets/brand/feature-navigation.jpg') },
  { id: 'vent', label: 'Active Ventilation', description: 'Smart airflow system with automatic cooling and humidity control.', price: 1799, image: require('../assets/brand/feature-ventilation.jpg') },
  { id: 'antifog', label: 'Anti-Fog Visor', description: 'Hydrophobic coating and quick-clearing visor treatment for wet rides.', price: 999, image: require('../assets/brand/feature-antifog.jpg') },
  { id: 'buckle', label: 'Quick-Release Buckle', description: 'One-touch magnetic buckle for fast on and off with gloves.', price: 799, image: require('../assets/brand/feature-buckle.jpg') },
];
const ZONES = ['01', '02', '03', '04'];
const FINISHES = [
  { label: 'Matte Black', color: '#172126' },
  { label: 'White', color: '#F7F8F7' },
  { label: 'Gunmetal Gray', color: '#778188' },
  { label: 'Teal', color: '#26B9B2' },
];
const VISORS = [
  { label: 'Smoke', color: '#343B3E' },
  { label: 'Clear', color: '#DBEFF1' },
  { label: 'Blue', color: '#4387B9' },
  { label: 'Gold', color: '#D1A956' },
];
const ACCENTS = [
  { label: 'Black', color: '#252A2B' },
  { label: 'Silver', color: '#AEB9BC' },
  { label: 'Teal', color: '#26B9B2' },
  { label: 'Red', color: '#CB5151' },
];
const formatPrice = (value: number) => `₹${value.toLocaleString('en-IN')}`;

export default function BuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ productId?: string; model?: string; base?: string; color?: string; size?: string }>();
  const parsedBasePrice = Number(params.base);
  const basePrice = Number.isFinite(parsedBasePrice) && parsedBasePrice > 0 ? parsedBasePrice : 9999;
  const productId = typeof params.productId === 'string' ? params.productId : '1';
  const modelName = typeof params.model === 'string' ? params.model : 'Pro X1';
  const productImage = PRODUCT_IMAGES[productId] ?? require('../assets/brand/builder-helmet.jpg');
  const [selected, setSelected] = useState<string[]>([]);
  const [activeZone, setActiveZone] = useState('01');
  const [color, setColor] = useState(typeof params.color === 'string' ? params.color : 'Matte Black');
  const [size, setSize] = useState(typeof params.size === 'string' ? params.size : 'M');

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addonsTotal = useMemo(() =>
    ADDONS.filter(a => selected.includes(a.id)).reduce((s, a) => s + a.price, 0),
    [selected]
  );

  const total = basePrice + addonsTotal;
  const savings = Math.min(1100, Math.floor(addonsTotal * 0.1));
  const finalTotal = total - savings;
  const selectedAddons = ADDONS.filter(item => selected.includes(item.id));
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EFF8FC' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 116 }}>
        <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 34, height: 34, borderRadius: 18, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Go back"><ArrowLeft size={18} color="#273740" /></TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#17232C' }}>Custom Builder</Text>
        </View>

        {/* Zone Blueprint */}
        <View style={{ margin: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12 }}>Your build</Text>
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: '#E2E8F0' }}>
            {/* Helmet Visual */}
            <View style={{ alignItems: 'center', marginBottom: 16, position: 'relative' }}>
              <Image source={productImage} resizeMode="cover" style={{ width: '100%', height: 160, borderRadius: 14 }} />
              {ZONES.map((zone, index) => <TouchableOpacity key={zone.id} onPress={() => setActiveZone(zone.id)} accessibilityLabel={`Choose ${zone.label}`} style={{ position: 'absolute', top: index < 2 ? 10 : 106, left: index % 2 === 0 ? 10 : undefined, right: index % 2 === 1 ? 10 : undefined, width: 26, height: 26, borderRadius: 8, backgroundColor: `${zone.color}28`, borderWidth: 1, borderColor: zone.color, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: zone.color, fontSize: 9, fontWeight: '900' }}>{zone.id}</Text></TouchableOpacity>)}
            </View>

            {/* Zone buttons */}
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {ZONES.map(zone => (
                <TouchableOpacity
                  key={zone.id}
                  onPress={() => setActiveZone(zone.id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
                    backgroundColor: activeZone === zone.id ? `${zone.color}18` : '#F8FAFC',
                    borderWidth: 1.5, borderColor: activeZone === zone.id ? zone.color : '#E2E8F0',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: zone.color, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900' }}>{zone.id}</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: activeZone === zone.id ? zone.color : '#64748B' }}>{zone.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Text style={{ color: '#738187', fontSize: 10, lineHeight: 15, marginTop: 11 }}>Start with a base model, then personalize shell finish, visor tint, earcup accents, and electronics in the next steps.</Text>
        </View>

        <View style={{ marginHorizontal: 18, marginTop: 13, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#D9F1EC', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 9, color: TEAL, fontWeight: '900' }}>1</Text></View>
          <Text style={{ color: TEAL, fontSize: 11, fontWeight: '800' }}>Step 1 of 4 · Choose Base Model</Text>
        </View>

        <View style={{ marginHorizontal: 14, marginBottom: 12, backgroundColor: '#FFF', borderRadius: 15, padding: 12, borderWidth: 1, borderColor: '#E1EAEC' }}>
          <Text style={{ color: '#26363D', fontSize: 11, fontWeight: '900', marginBottom: 8 }}>PERSONALIZE YOUR BUILD</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 11 }}>
            {ZONES.map((zone, index) => <TouchableOpacity key={zone} onPress={() => setActiveZone(zone)} accessibilityRole="button" accessibilityState={{ selected: activeZone === zone }} style={{ flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 9, backgroundColor: activeZone === zone ? '#E3F5F1' : '#F5F8F8', borderWidth: 1, borderColor: activeZone === zone ? '#77BDB4' : '#E6EDEE' }}><Text style={{ color: activeZone === zone ? TEAL : '#708087', fontSize: 9, fontWeight: '900' }}>{zone}</Text><Text style={{ color: activeZone === zone ? TEAL : '#708087', fontSize: 8, marginTop: 2 }}>{['Shell', 'Visor', 'Accent', 'Tech'][index]}</Text></TouchableOpacity>)}
          </View>
          {activeZone === '01' && <>
            <Text style={{ color: '#6E7B80', fontSize: 9, fontWeight: '700', marginBottom: 7 }}>SHELL FINISH · {color}</Text>
            <View style={{ flexDirection: 'row', gap: 7 }}>{FINISHES.map(finish => <TouchableOpacity key={finish.label} onPress={() => setColor(finish.label)} accessibilityRole="button" accessibilityState={{ selected: color === finish.label }} style={{ flex: 1, alignItems: 'center', gap: 4 }}><View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: finish.color, borderWidth: color === finish.label ? 2 : 1, borderColor: color === finish.label ? TEAL : '#D8E1E3' }} /> <Text numberOfLines={1} style={{ color: '#66767D', fontSize: 7 }}>{finish.label}</Text></TouchableOpacity>)}</View>
            <Text style={{ color: '#6E7B80', fontSize: 9, fontWeight: '700', marginTop: 10, marginBottom: 6 }}>HELMET SIZE · {size}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>{['S', 'M', 'L', 'XL'].map(option => <TouchableOpacity key={option} onPress={() => setSize(option)} accessibilityRole="button" accessibilityState={{ selected: size === option }} style={{ flex: 1, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: size === option ? '#E3F5F1' : '#F7F9F9', borderWidth: 1, borderColor: size === option ? '#77BDB4' : '#E6EDEE' }}><Text style={{ color: size === option ? TEAL : '#65747A', fontSize: 9, fontWeight: '800' }}>{option}</Text></TouchableOpacity>)}</View>
          </>}
          {activeZone === '02' && <>
            <Text style={{ color: '#6E7B80', fontSize: 9, fontWeight: '700', marginBottom: 7 }}>VISOR TINT · {visor}</Text>
            <View style={{ flexDirection: 'row', gap: 7 }}>{VISORS.map(option => <TouchableOpacity key={option.label} onPress={() => setVisor(option.label)} accessibilityRole="button" accessibilityState={{ selected: visor === option.label }} style={{ flex: 1, alignItems: 'center', gap: 4 }}><View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: option.color, borderWidth: visor === option.label ? 2 : 1, borderColor: visor === option.label ? TEAL : '#D8E1E3' }} /><Text style={{ color: '#66767D', fontSize: 8 }}>{option.label}</Text></TouchableOpacity>)}</View>
          </>}
          {activeZone === '03' && <>
            <Text style={{ color: '#6E7B80', fontSize: 9, fontWeight: '700', marginBottom: 7 }}>EARCUP ACCENT · {accent}</Text>
            <View style={{ flexDirection: 'row', gap: 7 }}>{ACCENTS.map(option => <TouchableOpacity key={option.label} onPress={() => setAccent(option.label)} accessibilityRole="button" accessibilityState={{ selected: accent === option.label }} style={{ flex: 1, alignItems: 'center', gap: 4 }}><View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: option.color, borderWidth: accent === option.label ? 2 : 1, borderColor: accent === option.label ? TEAL : '#D8E1E3' }} /><Text style={{ color: '#66767D', fontSize: 8 }}>{option.label}</Text></TouchableOpacity>)}</View>
          </>}
          {activeZone === '04' && <Text style={{ color: '#66767D', fontSize: 9 }}>Choose smart electronics below. Tap a feature to add or remove it from your build.</Text>}
        </View>

        <View style={{ paddingHorizontal: 14 }}>
          <Text style={{ color: '#26363D', fontSize: 12, fontWeight: '900', marginBottom: 8 }}>AVAILABLE FEATURES</Text>
          {ADDONS.map(item => {
            const isSelected = selected.includes(item.id);
            return <TouchableOpacity key={item.id} onPress={() => toggle(item.id)} activeOpacity={0.8} style={{ backgroundColor: '#FFF', borderRadius: 15, padding: 9, flexDirection: 'row', alignItems: 'center', marginBottom: 7, borderWidth: 1, borderColor: isSelected ? '#D7E9E8' : '#E3ECEF' }}>
              <Image source={item.image} resizeMode="cover" style={{ width: 39, height: 39, borderRadius: 10, marginRight: 9, backgroundColor: '#F0F4F4' }} />
              <View style={{ flex: 1, paddingRight: 5 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#25343A', marginBottom: 3 }}>{item.label}</Text>
                <Text numberOfLines={2} style={{ fontSize: 9, lineHeight: 12, color: '#728087' }}>{item.description}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', minWidth: 63 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: TEAL }}>+{formatPrice(item.price)}</Text>
                <View style={{ marginTop: 4, borderRadius: 10, backgroundColor: isSelected ? '#E4F6F2' : '#F3F6F6', paddingHorizontal: 7, paddingVertical: 3 }}><Text style={{ fontSize: 8, fontWeight: '800', color: isSelected ? TEAL : '#738187' }}>{isSelected ? 'Selected' : 'Add'}</Text></View>
              </View>
            </TouchableOpacity>;
          })}
        </View>

        {/* Selected build summary */}
        <View style={{ marginHorizontal: 20, marginTop: 10, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 15, borderWidth: 1.5, borderColor: '#D8E5EC' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#17232C', fontSize: 15, fontWeight: '900' }}>Selected Configuration</Text>
            <View style={{ backgroundColor: '#E5F6F4', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 }}><Text style={{ color: '#168F87', fontSize: 9, fontWeight: '800' }}>PREVIEW</Text></View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Image source={productImage} resizeMode="cover" style={{ width: 64, height: 58, borderRadius: 11, marginRight: 11 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#17232C', fontSize: 13, fontWeight: '800' }}>AsonyxAI {modelName}</Text>
              <Text style={{ color: '#64748B', fontSize: 10, marginTop: 4 }}>{color} shell · Size {size} · {selectedAddons.length} features</Text>
            </View>
            <Text style={{ color: '#168F87', fontSize: 9, fontWeight: '800' }}>CUSTOM</Text>
          </View>

          {selectedAddons.length > 0 ? selectedAddons.map(addon => (
            <View key={addon.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
              <Text style={{ color: '#64748B', fontSize: 11, flex: 1, paddingRight: 8 }}>• {addon.label}</Text>
            </View>
          )) : <Text style={{ color: '#64748B', fontSize: 11, marginBottom: 6 }}>No add-on features selected</Text>}

          <View style={{ height: 1, backgroundColor: '#E7EDF0', marginVertical: 8 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: '#64748B', fontSize: 11 }}>Base model</Text><Text style={{ color: '#17232C', fontSize: 11, fontWeight: '700' }}>₹{basePrice.toLocaleString('en-IN')}</Text></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: '#64748B', fontSize: 11 }}>Feature bundle</Text><Text style={{ color: '#17232C', fontSize: 11, fontWeight: '700' }}>₹{addonsTotal.toLocaleString('en-IN')}</Text></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: '#168F87', fontSize: 11 }}>Builder bundle savings</Text><Text style={{ color: '#168F87', fontSize: 11, fontWeight: '700' }}>−₹{savings.toLocaleString('en-IN')}</Text></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: '#64748B', fontSize: 11 }}>Standard delivery</Text><Text style={{ color: '#168F87', fontSize: 11, fontWeight: '700' }}>FREE*</Text></View>
          <View style={{ height: 1, backgroundColor: '#E7EDF0', marginVertical: 8 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: '#17232C', fontSize: 14, fontWeight: '900' }}>Final price</Text><Text style={{ color: '#168F87', fontSize: 18, fontWeight: '900' }}>₹{finalTotal.toLocaleString('en-IN')}</Text></View>
          <Text style={{ color: '#81919A', fontSize: 9, lineHeight: 13, marginTop: 7 }}>*Delivery and the displayed prices are previews; no order or dispatch is created yet.</Text>
        </View>
      </ScrollView>

      {/* Fixed Price Bar */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0',
        shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, elevation: 16,
        padding: 20, paddingBottom: 28,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <View>
            <Text style={{ color: '#64748B', fontSize: 12 }}>Base ₹{basePrice.toLocaleString('en-IN')} + {selected.length} add-ons</Text>
            {savings > 0 && <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '600' }}>💰 Bundle savings: ₹{savings.toLocaleString('en-IN')}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#94A3B8', fontSize: 11 }}>Total Payable</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A' }}>₹{finalTotal.toLocaleString('en-IN')}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push({ pathname: '/checkout', params: { kind: 'builder', productId, model: `AsonyxAI ${modelName}`, color, size, base: String(basePrice), addonTotal: String(addonsTotal), savings: String(savings), addons: JSON.stringify(selectedAddons.map(({ id, label, price }) => ({ id, label, price }))), total: String(finalTotal) } })} activeOpacity={0.85}>
          <LinearGradient
            colors={['#00D1B2', '#05A894']}
            style={{ borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <ShoppingCart size={18} color="#FFF" />
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>Continue to Review • ₹{finalTotal.toLocaleString('en-IN')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <View style={{ height: 69, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#DDE8EA', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
        {[{ label: 'Home', Icon: Home, route: '/(tabs)' }, { label: 'Helmet', Icon: TrendingUp, route: '/(tabs)/helmets' }, { label: 'Profile', Icon: UserRound, route: '/(tabs)/profile' }, { label: 'Settings', Icon: Settings, route: '/(tabs)/settings' }].map(({ label, Icon, route }) => <TouchableOpacity key={label} onPress={() => router.replace(route as never)} style={{ alignItems: 'center', justifyContent: 'center', minWidth: 54, gap: 3 }}><Icon size={16} color={label === 'Helmet' ? TEAL : '#78858B'} /><Text style={{ fontSize: 8, color: label === 'Helmet' ? TEAL : '#78858B', fontWeight: '600' }}>{label}</Text></TouchableOpacity>)}
      </View>
    </SafeAreaView>
  );
}

