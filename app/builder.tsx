import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Plus, ShoppingCart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_PRICE = 9999;

const ADDONS = [
  { id: 'camera', label: '4K Action Camera', price: 2499, image: require('../assets/brand/feature-camera.jpg'), zone: '01' },
  { id: 'storage', label: 'Integrated Storage (64GB)', price: 1299, image: require('../assets/brand/feature-storage.jpg'), zone: '01' },
  { id: 'audio', label: 'Premium Sound System', price: 2999, image: require('../assets/brand/feature-sound.jpg'), zone: '03' },
  { id: 'brake', label: 'Rear Smart Brake Lighting', price: 1499, image: require('../assets/brand/feature-lighting.jpg'), zone: '04' },
  { id: 'hud', label: 'Turn-by-Turn Visor HUD', price: 1999, image: require('../assets/brand/feature-navigation.jpg'), zone: '02' },
  { id: 'vent', label: 'Active Ventilation', price: 1799, image: require('../assets/brand/feature-ventilation.jpg'), zone: '01' },
  { id: 'antifog', label: 'Anti-Fog Visor', price: 999, image: require('../assets/brand/feature-antifog.jpg'), zone: '02' },
  { id: 'buckle', label: 'Quick-Release Buckle', price: 799, image: require('../assets/brand/feature-buckle.jpg'), zone: '04' },
];

const ZONES = [
  { id: '01', label: 'Shell Finish', color: '#00D1B2' },
  { id: '02', label: 'Visor Tint', color: '#3B82F6' },
  { id: '03', label: 'Earcups', color: '#F59E0B' },
  { id: '04', label: 'Electronics', color: '#8B5CF6' },
];

export default function BuilderScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [activeZone, setActiveZone] = useState('01');
  const [color, setColor] = useState('Matte Black');
  const [size, setSize] = useState('M');

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addonsTotal = useMemo(() =>
    ADDONS.filter(a => selected.includes(a.id)).reduce((s, a) => s + a.price, 0),
    [selected]
  );

  const total = BASE_PRICE + addonsTotal;
  const savings = Math.min(1100, Math.floor(addonsTotal * 0.1));
  const finalTotal = total - savings;
  const selectedAddons = ADDONS.filter(addon => selected.includes(addon.id));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEF7FD' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 210 }}>
        {/* Header */}
        <View style={{ paddingTop: 16, paddingBottom: 14, paddingHorizontal: 20 }}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/helmets')} accessibilityLabel="Back to helmets" style={{ marginBottom: 12 }}>
            <Text style={{ color: '#168F87', fontSize: 13, fontWeight: '700' }}>← Back to Store</Text>
          </TouchableOpacity>
          <Text style={{ color: '#52616B', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>CUSTOM BUILDER</Text>
          <Text style={{ color: '#17232C', fontSize: 22, fontWeight: '800', marginTop: 4 }}>Design Your Helmet</Text>
          <Text style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>Choose a finish, size and optional features</Text>
        </View>

        {/* Zone Blueprint */}
        <View style={{ margin: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12 }}>Your build</Text>
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: '#E2E8F0' }}>
            {/* Helmet Visual */}
            <View style={{ alignItems: 'center', marginBottom: 16, position: 'relative' }}>
              <Image source={require('../assets/brand/builder-helmet.jpg')} resizeMode="cover" style={{ width: '100%', height: 160, borderRadius: 14 }} />
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
          <Text style={{ color: '#64748B', fontSize: 11, lineHeight: 16, marginTop: 8 }}>Choose a base finish, then personalize the shell, visor tint, earcups and electronics.</Text>
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#17232C', marginBottom: 8 }}>Shell finish</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {['Matte Black', 'White', 'Gunmetal Gray', 'Teal'].map((finish, index) => <TouchableOpacity key={finish} onPress={() => setColor(finish)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: color === finish ? '#168F87' : '#D8E5EC' }}><View style={{ width: 15, height: 15, borderRadius: 8, backgroundColor: ['#152126', '#F8FAFC', '#78828A', '#26C6C9'][index], borderWidth: 1, borderColor: '#CCD8DE' }} /><Text style={{ color: '#31414A', fontSize: 10, fontWeight: color === finish ? '700' : '500' }}>{finish}</Text></TouchableOpacity>)}
          </View>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#17232C', marginTop: 13, marginBottom: 8 }}>Helmet size</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>{['S', 'M', 'L', 'XL'].map(item => <TouchableOpacity key={item} onPress={() => setSize(item)} style={{ width: 42, height: 35, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: size === item ? '#168F87' : '#FFF', borderWidth: 1, borderColor: size === item ? '#168F87' : '#D8E5EC' }}><Text style={{ color: size === item ? '#FFF' : '#31414A', fontWeight: '700', fontSize: 12 }}>{item}</Text></TouchableOpacity>)}</View>
          <Text style={{ color: '#168F87', fontSize: 11, fontWeight: '700', marginTop: 12 }}>Selected: {color} • Size {size}</Text>
        </View>

        {/* Add-ons */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 }}>Add-On Accessories</Text>
          {ADDONS.map((addon) => {
            const isSelected = selected.includes(addon.id);
            const zone = ZONES.find(z => z.id === addon.zone);
            return (
              <TouchableOpacity
                key={addon.id}
                onPress={() => toggle(addon.id)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#FFF', borderRadius: 16, padding: 14,
                  flexDirection: 'row', alignItems: 'center', marginBottom: 10,
                  borderWidth: 1.5, borderColor: isSelected ? '#00D1B2' : '#E2E8F0',
                  shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: isSelected ? 'rgba(0,209,178,0.1)' : '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Image source={addon.image} resizeMode="cover" style={{ width: 44, height: 44, borderRadius: 10 }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 2 }}>{addon.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#00D1B2' }}>+₹{addon.price.toLocaleString('en-IN')}</Text>
                    <View style={{ backgroundColor: zone?.color + '22', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: zone?.color }}>Zone {addon.zone}</Text>
                    </View>
                  </View>
                </View>
                <View style={{
                  width: 28, height: 28, borderRadius: 8,
                  backgroundColor: isSelected ? '#00D1B2' : '#F1F5F9',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {isSelected ? <Check size={14} color="#FFF" strokeWidth={3} /> : <Plus size={14} color="#94A3B8" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected build summary */}
        <View style={{ marginHorizontal: 20, marginTop: 10, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 15, borderWidth: 1.5, borderColor: '#D8E5EC' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#17232C', fontSize: 15, fontWeight: '900' }}>Selected Configuration</Text>
            <View style={{ backgroundColor: '#E5F6F4', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 }}><Text style={{ color: '#168F87', fontSize: 9, fontWeight: '800' }}>PREVIEW</Text></View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Image source={require('../assets/brand/builder-helmet.jpg')} resizeMode="cover" style={{ width: 64, height: 58, borderRadius: 11, marginRight: 11 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#17232C', fontSize: 13, fontWeight: '800' }}>AsonyxAI Pro X1</Text>
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: '#64748B', fontSize: 11 }}>Base model</Text><Text style={{ color: '#17232C', fontSize: 11, fontWeight: '700' }}>₹{BASE_PRICE.toLocaleString('en-IN')}</Text></View>
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
            <Text style={{ color: '#64748B', fontSize: 12 }}>Base ₹{BASE_PRICE.toLocaleString('en-IN')} + {selected.length} add-ons</Text>
            {savings > 0 && <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '600' }}>💰 Bundle savings: ₹{savings.toLocaleString('en-IN')}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#94A3B8', fontSize: 11 }}>Total Payable</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A' }}>₹{finalTotal.toLocaleString('en-IN')}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push({ pathname: '/checkout', params: { kind: 'builder', model: 'AsonyxAI Pro X1', color, size, base: String(BASE_PRICE), addonTotal: String(addonsTotal), savings: String(savings), addons: JSON.stringify(selectedAddons.map(({ id, label, price }) => ({ id, label, price }))), total: String(finalTotal) } })} activeOpacity={0.85}>
          <LinearGradient
            colors={['#00D1B2', '#05A894']}
            style={{ borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <ShoppingCart size={18} color="#FFF" />
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>Buy Now – ₹{finalTotal.toLocaleString('en-IN')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
