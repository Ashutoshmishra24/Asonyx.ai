import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, TextInput, Dimensions, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search, Star, X, Check, WandSparkles,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_W = (width - 52) / 2;

const HELMETS = [
  { id: 1, name: 'Pro X1', price: 5999, tag: 'BESTSELLER', rating: 4.8, reviews: 342, image: require('../../assets/brand/helmet-pro-x1.jpg'), tagColor: '#00D1B2' },
  { id: 2, name: 'Urban Rider', price: 8499, tag: 'POPULAR', rating: 4.5, reviews: 218, image: require('../../assets/brand/helmet-urban-rider.jpg'), tagColor: '#3B82F6' },
  { id: 3, name: 'Sport Elite', price: 15999, tag: 'NEW', rating: 4.9, reviews: 87, image: require('../../assets/brand/helmet-sport-elite.jpg'), tagColor: '#EF4444' },
  { id: 4, name: 'Touring Max', price: 18499, tag: 'PREMIUM', rating: 4.7, reviews: 156, image: require('../../assets/brand/helmet-touring-max.jpg'), tagColor: '#8B5CF6' },
];

const COLORS = [
  { name: 'Matte Black', hex: '#1C1C1E' },
  { name: 'Pearl White', hex: '#F8F8F8' },
  { name: 'Gunmetal Gray', hex: '#6B7280' },
  { name: 'Teal', hex: '#00D1B2' },
];

const SIZES = ['S', 'M', 'L', 'XL'];

const FEATURES = ['4K Camera', '24GB Storage', '64GB Storage', '128GB Storage', 'Gesture Control', 'Sony Speaker', 'Premium Visor', 'Clear Audio'];

export default function HelmetsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedHelmet, setSelectedHelmet] = useState<typeof HELMETS[0] | null>(null);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['4K Camera', 'Sony Speaker']);

  const filtered = HELMETS.filter(h => h.name.toLowerCase().includes(search.toLowerCase()));

  const toggleFeature = (f: string) => {
    setSelectedFeatures(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#EEF7FD' }}>
      {/* Header */}
      <View style={{ paddingTop: 18, paddingBottom: 14, paddingHorizontal: 20, backgroundColor: '#EEF7FD' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ color: '#15222B', fontSize: 22, fontWeight: '800' }}>All Helmets</Text>
          </View>
        </View>

        {/* Search */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: '#FFF', borderRadius: 14,
          paddingHorizontal: 14, borderWidth: 1, borderColor: '#D8E5EC',
        }}>
          <Search size={16} color="#64748B" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search helmets..."
            placeholderTextColor="#91A0AA"
            style={{ flex: 1, height: 44, marginLeft: 10, color: '#15222B', fontSize: 14 }}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
          {filtered.map(helmet => (
            <TouchableOpacity
              key={helmet.id}
              onPress={() => setSelectedHelmet(helmet)}
              activeOpacity={0.8}
              style={{
                width: CARD_W, backgroundColor: '#FFF', borderRadius: 20,
                overflow: 'hidden', borderWidth: 1.5, borderColor: '#E2E8F0',
                shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
              }}
            >
              {/* Image area */}
              <View style={{ height: 130, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 8 }}>
                <Image source={helmet.image} resizeMode="cover" style={{ width: '100%', height: '100%', borderRadius: 14 }} />
                <View style={{
                  position: 'absolute', top: 10, left: 10,
                  backgroundColor: helmet.tagColor, borderRadius: 8,
                  paddingHorizontal: 8, paddingVertical: 3,
                }}>
                  <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '800' }}>{helmet.tag}</Text>
                </View>
              </View>
              <View style={{ padding: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>{helmet.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '700' }}>{helmet.rating}</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 11 }}>({helmet.reviews})</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#00D1B2' }}>₹{helmet.price.toLocaleString('en-IN')}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Product Detail Modal */}
      <Modal visible={!!selectedHelmet} transparent animationType="slide" onRequestClose={() => setSelectedHelmet(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#F4FAF8', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%' }}>
            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>{selectedHelmet?.name}</Text>
                <TouchableOpacity onPress={() => setSelectedHelmet(null)} style={{ padding: 8, borderRadius: 10, backgroundColor: '#E2E8F0' }}>
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Large Emoji Display */}
              <View style={{ backgroundColor: '#FFF', borderRadius: 20, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1.5, borderColor: '#E2E8F0' }}>
                {selectedHelmet && <Image source={selectedHelmet.image} resizeMode="cover" style={{ width: '100%', height: '100%', borderRadius: 16 }} />}
              </View>

              {/* Price */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#00D1B2' }}>
                  ₹{selectedHelmet?.price.toLocaleString('en-IN')}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Star size={16} color="#F59E0B" fill="#F59E0B" />
                  <Text style={{ fontWeight: '700', color: '#0F172A' }}>{selectedHelmet?.rating}</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>({selectedHelmet?.reviews} reviews)</Text>
                </View>
              </View>

              {/* Color Swatches */}
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748B', letterSpacing: 0.5, marginBottom: 10 }}>
                COLOR: {COLORS[selectedColor].name.toUpperCase()}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                {COLORS.map((c, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setSelectedColor(i)}
                    style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: c.hex,
                      borderWidth: selectedColor === i ? 3 : 2,
                      borderColor: selectedColor === i ? '#00D1B2' : (c.hex === '#F8F8F8' ? '#E2E8F0' : c.hex),
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {selectedColor === i && <Check size={14} color={c.hex === '#1C1C1E' || c.hex === '#00D1B2' ? '#FFF' : '#0F172A'} />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Size Selector */}
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748B', letterSpacing: 0.5, marginBottom: 10 }}>SIZE</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                {SIZES.map(size => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setSelectedSize(size)}
                    style={{
                      width: 52, height: 44, borderRadius: 12,
                      backgroundColor: selectedSize === size ? '#00D1B2' : '#FFF',
                      borderWidth: 1.5, borderColor: selectedSize === size ? '#00D1B2' : '#E2E8F0',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontWeight: '800', fontSize: 14, color: selectedSize === size ? '#FFF' : '#0F172A' }}>{size}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Smart Features */}
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748B', letterSpacing: 0.5, marginBottom: 10 }}>SMART FEATURES</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {FEATURES.map(f => {
                  const active = selectedFeatures.includes(f);
                  return (
                    <TouchableOpacity
                      key={f}
                      onPress={() => toggleFeature(f)}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                        backgroundColor: active ? 'rgba(0,209,178,0.1)' : '#FFF',
                        borderWidth: 1.5, borderColor: active ? '#00D1B2' : '#E2E8F0',
                        flexDirection: 'row', alignItems: 'center', gap: 4,
                      }}
                    >
                      {active && <Check size={11} color="#00D1B2" strokeWidth={3} />}
                      <Text style={{ color: active ? '#00D1B2' : '#64748B', fontSize: 12, fontWeight: '600' }}>{f}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Config Summary */}
              <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 1.5, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 8 }}>SELECTED CONFIGURATION</Text>
                <Text style={{ color: '#0F172A', fontSize: 13, lineHeight: 20 }}>
                  {selectedHelmet?.name} • {COLORS[selectedColor].name} • Size {selectedSize}{'\n'}
                  Features: {selectedFeatures.join(', ')}
                </Text>
              </View>

              {/* Direct purchase + custom builder */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    if (selectedHelmet) {
                      router.push({
                        pathname: '/builder',
                        params: {
                          productId: String(selectedHelmet.id),
                          model: selectedHelmet.name,
                          base: String(selectedHelmet.price),
                          color: COLORS[selectedColor].name,
                          size: selectedSize,
                        },
                      });
                    }
                    setSelectedHelmet(null);
                  }}
                  accessibilityLabel={`Customize ${selectedHelmet?.name ?? 'helmet'}`}
                  style={{ flex: 1, height: 52, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#00D1B2', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}
                >
                  <WandSparkles size={16} color="#00A995" />
                  <Text style={{ color: '#00A995', fontWeight: '800', fontSize: 14 }}>Customize</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedHelmet(null);
                    if (selectedHelmet) router.push({ pathname: '/checkout', params: { kind: 'product', productId: String(selectedHelmet.id), model: selectedHelmet.name, price: String(selectedHelmet.price), color: COLORS[selectedColor].name, size: selectedSize } });
                  }}
                  style={{ flex: 1.5 }}
                >
                  <LinearGradient colors={['#00D1B2', '#05A894']} style={{ height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>Buy Now ₹{selectedHelmet?.price.toLocaleString('en-IN')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
