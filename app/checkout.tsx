import { useState } from 'react';
import {
  Image, View, Text, ScrollView, TouchableOpacity,
  TextInput, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ChevronDown, ChevronUp, Check, CreditCard, Truck, Smartphone, Building2, X, MapPin, Edit2, UserRound, LockKeyhole } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

type PayMethod = 'cod' | 'upi' | 'card' | 'netbanking' | null;
type OrderAddon = { id: string; label: string; price: number };

const BANKS = ['HDFC Bank', 'SBI', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'];

function readAddons(value: string | string[] | undefined): OrderAddon[] {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is OrderAddon => {
      if (typeof item !== 'object' || item === null) return false;
      const candidate = item as Record<string, unknown>;
      return typeof candidate.id === 'string'
        && typeof candidate.label === 'string'
        && typeof candidate.price === 'number'
        && Number.isFinite(candidate.price)
        && candidate.price >= 0;
    });
  } catch {
    return [];
  }
}

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string; model?: string; price?: string; total?: string; base?: string; addonTotal?: string; savings?: string; addons?: string; color?: string; size?: string }>();
  const productPrice = Number(params.price);
  const builderTotal = Number(params.total);
  const isProduct = params.kind === 'product' && Number.isFinite(productPrice) && productPrice > 0;
  const modelName = typeof params.model === 'string' ? params.model : 'Asonyx X-1 Custom Build';
  const addons = readAddons(params.addons);
  const parsedBase = Number(params.base);
  const parsedAddonTotal = Number(params.addonTotal);
  const parsedSavings = Number(params.savings);
  const baseModel = isProduct ? productPrice : Number.isFinite(parsedBase) && parsedBase > 0 ? parsedBase : 9999;
  const addonTotal = isProduct ? 0 : Number.isFinite(parsedAddonTotal) && parsedAddonTotal >= 0 ? parsedAddonTotal : addons.reduce((sum, addon) => sum + addon.price, 0);
  const savings = isProduct ? 0 : Number.isFinite(parsedSavings) && parsedSavings >= 0 ? parsedSavings : Math.min(1100, Math.floor(addonTotal * 0.1));
  const total = isProduct ? productPrice : Number.isFinite(builderTotal) && builderTotal > 0 ? builderTotal : baseModel + addonTotal - savings;
  const buildColor = typeof params.color === 'string' ? params.color : 'Matte Black';
  const buildSize = typeof params.size === 'string' ? params.size : 'M';
  const [payMethod, setPayMethod] = useState<PayMethod>(null);
  const [upi, setUpi] = useState('');
  const [cardNum, setCardNum] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [upiErr, setUpiErr] = useState('');
  const [buyerName, setBuyerName] = useState('Arjun Mehta');
  const [buyerMobile, setBuyerMobile] = useState('+91 98765 43210');
  const [buyerEmail, setBuyerEmail] = useState('arjun.mehta@example.com');
  const [addressLine, setAddressLine] = useState('42, Indiranagar 12th Main, HAL 2nd Stage');
  const [addressCity, setAddressCity] = useState('Bengaluru, Karnataka 560038 · India');
  const [editSection, setEditSection] = useState<'contact' | 'address' | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftMobile, setDraftMobile] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftAddressLine, setDraftAddressLine] = useState('');
  const [draftAddressCity, setDraftAddressCity] = useState('');

  const validateUPI = (v: string) => {
    setUpi(v);
    if (v.length > 0 && !/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/.test(v)) {
      setUpiErr('Enter valid UPI ID (e.g., name@okaxis)');
    } else {
      setUpiErr('');
    }
  };

  const formatCard = (v: string) => {
    const nums = v.replace(/\D/g, '').slice(0, 16);
    return nums.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (v: string) => {
    const nums = v.replace(/\D/g, '').slice(0, 4);
    if (nums.length >= 3) return nums.slice(0, 2) + '/' + nums.slice(2);
    return nums;
  };

  const canPay = termsAccepted && (
    payMethod === 'cod' ||
    (payMethod === 'upi' && upi.length > 3 && !upiErr) ||
    (payMethod === 'card' && cardNum.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvv.length === 3) ||
    (payMethod === 'netbanking' && selectedBank !== '')
  );

  const PayMethodCard = ({
    id, icon: Icon, label,
  }: { id: PayMethod; icon: any; label: string }) => {
    const active = payMethod === id;
    return (
      <TouchableOpacity
        onPress={() => setPayMethod(active ? null : id)}
        style={{
          backgroundColor: '#FFF', borderRadius: 16, marginBottom: 10,
          borderWidth: 1.5, borderColor: active ? '#00D1B2' : '#E2E8F0',
          overflow: 'hidden',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: active ? 'rgba(0,209,178,0.1)' : '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={20} color={active ? '#00D1B2' : '#64748B'} />
          </View>
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: active ? '#0F172A' : '#374151' }}>{label}</Text>
          {active ? <ChevronUp size={18} color="#00D1B2" /> : <ChevronDown size={18} color="#94A3B8" />}
        </View>

        {active && id === 'upi' && (
          <View style={{ padding: 14, paddingTop: 0 }}>
            <TextInput
              value={upi}
              onChangeText={validateUPI}
              placeholder="Enter UPI ID (e.g., arjun@okaxis)"
              placeholderTextColor="#94A3B8"
              style={{
                backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, fontSize: 14,
                borderWidth: upiErr ? 2 : 1.5, borderColor: upiErr ? '#EF4444' : '#E2E8F0',
                color: '#0F172A', marginBottom: upiErr ? 6 : 12,
              }}
              autoCapitalize="none"
            />
            {!!upiErr && <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 10 }}>{upiErr}</Text>}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[{ name: 'GPay', emoji: '🟢' }, { name: 'PhonePe', emoji: '🟣' }, { name: 'BHIM', emoji: '🔵' }].map(app => (
                <TouchableOpacity
                  key={app.name}
                  onPress={() => setUpi(`arjun@${app.name.toLowerCase()}`)}
                  style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 18, marginBottom: 2 }}>{app.emoji}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#374151' }}>{app.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {active && id === 'card' && (
          <View style={{ padding: 14, paddingTop: 0 }}>
            <TextInput
              value={cardNum}
              onChangeText={v => setCardNum(formatCard(v))}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor="#94A3B8"
              style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, fontSize: 16, borderWidth: 1.5, borderColor: '#E2E8F0', color: '#0F172A', marginBottom: 10, letterSpacing: 2 }}
              keyboardType="number-pad"
              maxLength={19}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={expiry}
                onChangeText={v => setExpiry(formatExpiry(v))}
                placeholder="MM/YY"
                placeholderTextColor="#94A3B8"
                style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1.5, borderColor: '#E2E8F0', color: '#0F172A' }}
                keyboardType="number-pad"
                maxLength={5}
              />
              <TextInput
                value={cvv}
                onChangeText={v => setCvv(v.replace(/\D/g, '').slice(0, 3))}
                placeholder="CVV"
                placeholderTextColor="#94A3B8"
                style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1.5, borderColor: '#E2E8F0', color: '#0F172A' }}
                keyboardType="number-pad"
                maxLength={3}
                secureTextEntry
              />
            </View>
          </View>
        )}

        {active && id === 'netbanking' && (
          <View style={{ padding: 14, paddingTop: 0 }}>
            {BANKS.map(bank => (
              <TouchableOpacity
                key={bank}
                onPress={() => setSelectedBank(bank)}
                style={{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  padding: 12, borderRadius: 10, marginBottom: 6,
                  backgroundColor: selectedBank === bank ? 'rgba(0,209,178,0.08)' : '#F8FAFC',
                  borderWidth: 1.5, borderColor: selectedBank === bank ? '#00D1B2' : '#E2E8F0',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>{bank}</Text>
                {selectedBank === bank && <Check size={16} color="#00D1B2" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {active && id === 'cod' && (
          <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
            <View style={{ backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FDE68A' }}>
              <Text style={{ color: '#92400E', fontSize: 13, fontWeight: '600' }}>
                This is only a payment-method preview. No cash collection or order request is created.
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEF7FD' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ paddingHorizontal: 17, paddingTop: 8, paddingBottom: 13 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 13 }}>
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace(isProduct ? '/helmets' : '/builder')} accessibilityLabel={isProduct ? 'Back to helmets' : 'Back to builder'} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8E5EC', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={19} color="#17232C" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#168F87', fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>FINAL STEP</Text>
              <Text style={{ color: '#17232C', fontSize: 20, fontWeight: '900', marginTop: 1 }}>Payment</Text>
            </View>
            <View style={{ borderRadius: 14, backgroundColor: '#E2F3F2', paddingHorizontal: 11, paddingVertical: 6 }}><Text style={{ color: '#168F87', fontSize: 9, fontWeight: '800' }}>PREVIEW</Text></View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 13 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#168F87', alignItems: 'center', justifyContent: 'center' }}><Check size={13} color="#FFFFFF" strokeWidth={3} /></View>
            <View style={{ height: 2, flex: 1, backgroundColor: '#168F87', marginHorizontal: 7 }} />
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#0E4140', borderWidth: 3, borderColor: '#B6E4E0' }} />
          </View>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 19, borderWidth: 1, borderColor: '#D8E5EC', padding: 11, flexDirection: 'row', alignItems: 'center' }}>
            <Image source={isProduct ? require('../assets/brand/helmet-detail-urban.jpg') : require('../assets/brand/builder-helmet.jpg')} resizeMode="cover" style={{ width: 88, height: 82, borderRadius: 14, marginRight: 11 }} />
            <View style={{ flex: 1 }}>
              <View style={{ alignSelf: 'flex-start', backgroundColor: '#E5F6F4', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, marginBottom: 5 }}><Text style={{ color: '#168F87', fontSize: 8, fontWeight: '900' }}>{isProduct ? 'HELMET' : 'CUSTOM BUILD'}</Text></View>
              <Text numberOfLines={1} style={{ color: '#17232C', fontSize: 14, fontWeight: '900' }}>{modelName}</Text>
              <Text numberOfLines={2} style={{ color: '#64748B', fontSize: 10, lineHeight: 14, marginTop: 3 }}>{isProduct ? 'Standard configuration' : `${buildColor} shell · Smoke visor · Size ${buildSize}`}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 }}>
                <Text style={{ color: '#64748B', fontSize: 9 }}>Payable in preview</Text>
                <Text style={{ color: '#168F87', fontSize: 17, fontWeight: '900' }}>₹{total.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ padding: 20 }}>
          <Text style={{ color: '#17232C', fontSize: 17, fontWeight: '900' }}>Buyer & delivery</Text>
          <Text style={{ color: '#64748B', fontSize: 11, marginTop: 3, marginBottom: 11 }}>Confirmation and dispatch details for this local preview.</Text>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#D8E5EC', padding: 13, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#E4F5F3', alignItems: 'center', justifyContent: 'center', marginRight: 9 }}><UserRound size={17} color="#168F87" /></View>
              <Text style={{ color: '#17232C', fontSize: 13, fontWeight: '800', flex: 1 }}>Contact details</Text>
              <TouchableOpacity onPress={() => { setDraftName(buyerName); setDraftMobile(buyerMobile); setDraftEmail(buyerEmail); setEditSection('contact'); }}><Text style={{ color: '#168F87', fontSize: 9, fontWeight: '900' }}>EDIT</Text></TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1, borderWidth: 1, borderColor: '#E3EAEE', borderRadius: 11, padding: 9 }}><Text style={{ color: '#71818B', fontSize: 9 }}>FULL NAME</Text><Text numberOfLines={1} style={{ color: '#17232C', fontSize: 11, fontWeight: '700', marginTop: 4 }}>{buyerName}</Text></View>
              <View style={{ flex: 1, borderWidth: 1, borderColor: '#E3EAEE', borderRadius: 11, padding: 9 }}><Text style={{ color: '#71818B', fontSize: 9 }}>MOBILE</Text><Text numberOfLines={1} style={{ color: '#17232C', fontSize: 11, fontWeight: '700', marginTop: 4 }}>{buyerMobile}</Text></View>
            </View>
            <Text style={{ color: '#71818B', fontSize: 9, marginTop: 9 }}>EMAIL</Text><Text style={{ color: '#33434B', fontSize: 11, marginTop: 3 }}>{buyerEmail}</Text>
            <Text style={{ color: '#81919A', fontSize: 9, marginTop: 7 }}>Sample details · not sent anywhere</Text>
          </View>

          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#D8E5EC', padding: 13, marginBottom: 19 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 11 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#E4F5F3', alignItems: 'center', justifyContent: 'center', marginRight: 9 }}><MapPin size={17} color="#168F87" /></View>
              <Text style={{ color: '#17232C', fontSize: 13, fontWeight: '800', flex: 1 }}>Delivery address</Text>
              <TouchableOpacity onPress={() => { setDraftAddressLine(addressLine); setDraftAddressCity(addressCity); setEditSection('address'); }}><Text style={{ color: '#168F87', fontSize: 9, fontWeight: '900' }}>EDIT</Text></TouchableOpacity>
            </View>
            <Text style={{ color: '#33434B', fontSize: 11, lineHeight: 16 }}>{addressLine}</Text>
            <Text style={{ color: '#64748B', fontSize: 10, marginTop: 3 }}>{addressCity}</Text>
            <View style={{ borderWidth: 1, borderColor: '#E3EAEE', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: '#64748B', fontSize: 10 }}>Standard delivery · preview only</Text><Text style={{ color: '#168F87', fontSize: 10, fontWeight: '800' }}>FREE</Text></View>
          </View>

          {/* Payment Methods */}
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>Payment Method Preview</Text>
          <Text style={{ fontSize: 12, lineHeight: 17, color: '#64748B', marginBottom: 12 }}>No payment provider is connected. Do not enter real card or bank details; fields are for trying the screen only.</Text>
          <PayMethodCard id="cod" icon={Truck} label="Cash on Delivery" />
          <PayMethodCard id="upi" icon={Smartphone} label="UPI Payment" />
          <PayMethodCard id="card" icon={CreditCard} label="Credit / Debit Card" />
          <PayMethodCard id="netbanking" icon={Building2} label="Net Banking" />

          {/* Complete order summary, placed after the payment choices like the reference screen. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, marginBottom: 10 }}>
            <Text style={{ flex: 1, color: '#17232C', fontSize: 17, fontWeight: '900' }}>Order summary</Text>
            {!isProduct && <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/builder')} accessibilityLabel="Edit helmet build" style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Edit2 size={13} color="#168F87" /><Text style={{ color: '#168F87', fontSize: 9, fontWeight: '900' }}>EDIT BUILD</Text></TouchableOpacity>}
          </View>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1, borderColor: '#D8E5EC', padding: 14, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 11 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#E4F5F3', alignItems: 'center', justifyContent: 'center', marginRight: 9 }}><Check size={16} color="#168F87" /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#17232C', fontSize: 13, fontWeight: '900' }}>{modelName}</Text>
                <Text style={{ color: '#64748B', fontSize: 10, marginTop: 3 }}>{isProduct ? 'Standard configuration' : `${buildColor} shell · Smoke visor · Size ${buildSize}`}</Text>
              </View>
              <Text style={{ color: '#168F87', fontSize: 9, fontWeight: '800' }}>{isProduct ? '1 ITEM' : `${addons.length + 1} ITEMS`}</Text>
            </View>

            {!isProduct && addons.length > 0 && (
              <View style={{ backgroundColor: '#F5FAFB', borderRadius: 11, padding: 10, marginBottom: 10 }}>
                <Text style={{ color: '#64748B', fontSize: 9, fontWeight: '800', marginBottom: 4 }}>SELECTED FEATURES</Text>
                {addons.map(addon => <Text key={addon.id} style={{ color: '#52616B', fontSize: 10, lineHeight: 16 }}>• {addon.label}</Text>)}
              </View>
            )}

            <View style={{ height: 1, backgroundColor: '#E7EDF0', marginBottom: 7 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}><Text style={{ color: '#64748B', fontSize: 11 }}>Base model</Text><Text style={{ color: '#17232C', fontSize: 11, fontWeight: '700' }}>₹{baseModel.toLocaleString('en-IN')}</Text></View>
            {!isProduct && <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}><Text style={{ color: '#64748B', fontSize: 11 }}>Feature bundle</Text><Text style={{ color: '#17232C', fontSize: 11, fontWeight: '700' }}>₹{addonTotal.toLocaleString('en-IN')}</Text></View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}><Text style={{ color: '#168F87', fontSize: 11 }}>Builder bundle savings</Text><Text style={{ color: '#168F87', fontSize: 11, fontWeight: '700' }}>−₹{savings.toLocaleString('en-IN')}</Text></View>
            </>}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}><Text style={{ color: '#64748B', fontSize: 11 }}>Standard delivery</Text><Text style={{ color: '#168F87', fontSize: 11, fontWeight: '700' }}>FREE</Text></View>
            <Text style={{ color: '#81919A', fontSize: 9, marginTop: 1 }}>Displayed prices are an app preview, inclusive of applicable taxes.</Text>
            <View style={{ height: 1, backgroundColor: '#E7EDF0', marginVertical: 9 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: '#17232C', fontSize: 14, fontWeight: '900' }}>Final payable total</Text><Text style={{ color: '#168F87', fontSize: 18, fontWeight: '900' }}>₹{total.toLocaleString('en-IN')}</Text></View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#DDF3F4', borderRadius: 13, padding: 12, marginBottom: 15 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#C4E8E7', alignItems: 'center', justifyContent: 'center', marginRight: 9 }}><LockKeyhole size={16} color="#168F87" /></View>
            <View style={{ flex: 1 }}><Text style={{ color: '#17232C', fontSize: 11, fontWeight: '900' }}>Payment preview only</Text><Text style={{ color: '#64748B', fontSize: 9, marginTop: 2 }}>No payment details are sent or stored by this app.</Text></View>
            <LockKeyhole size={16} color="#168F87" />
          </View>

          {/* Terms */}
          <TouchableOpacity
            onPress={() => setTermsAccepted(!termsAccepted)}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20, marginTop: 8 }}
          >
            <View style={{
              width: 22, height: 22, borderRadius: 6, marginTop: 1,
              backgroundColor: termsAccepted ? '#00D1B2' : '#FFF',
              borderWidth: 2, borderColor: termsAccepted ? '#00D1B2' : '#E2E8F0',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {termsAccepted && <Check size={13} color="#FFF" strokeWidth={3} />}
            </View>
            <Text style={{ flex: 1, color: '#64748B', fontSize: 13, lineHeight: 18 }}>
              I agree to the{' '}
              <Text style={{ color: '#00D1B2', fontWeight: '600' }}>Terms & Conditions</Text>
              ,{' '}
              <Text style={{ color: '#00D1B2', fontWeight: '600' }}>Return Policy</Text>
              , and confirm this local order preview for ₹{total.toLocaleString('en-IN')}.
            </Text>
          </TouchableOpacity>

          {/* Pay Button */}
          <TouchableOpacity
            onPress={() => canPay && setSuccessModal(true)}
            disabled={!canPay}
            activeOpacity={canPay ? 0.85 : 1}
            style={{ opacity: canPay ? 1 : 0.4 }}
          >
            <LinearGradient
              colors={canPay ? ['#00D1B2', '#05A894'] : ['#94A3B8', '#94A3B8']}
              style={{ borderRadius: 16, height: 58, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 17 }}>
                 Create Order Preview • ₹{total.toLocaleString('en-IN')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 12 }}>
            Local preview only • No payment is taken or card data sent
          </Text>
        </View>
      </ScrollView>

      {/* Editable buyer and delivery details */}
      <Modal visible={editSection !== null} transparent animationType="fade" onRequestClose={() => setEditSection(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', padding: 22 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#D8E5EC' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ color: '#17232C', fontSize: 17, fontWeight: '900', flex: 1 }}>{editSection === 'contact' ? 'Contact details' : 'Delivery address'}</Text>
              <TouchableOpacity onPress={() => setEditSection(null)} accessibilityLabel="Close editor" style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F2F7F9', alignItems: 'center', justifyContent: 'center' }}><X size={17} color="#52616B" /></TouchableOpacity>
            </View>
            {editSection === 'contact' ? <>
              <TextInput value={draftName} onChangeText={setDraftName} placeholder="Full name" placeholderTextColor="#94A3B8" style={{ backgroundColor: '#F8FAFC', borderRadius: 11, padding: 12, borderWidth: 1, borderColor: '#D8E5EC', color: '#17232C', marginBottom: 9 }} />
              <TextInput value={draftMobile} onChangeText={setDraftMobile} placeholder="Mobile number" placeholderTextColor="#94A3B8" keyboardType="phone-pad" style={{ backgroundColor: '#F8FAFC', borderRadius: 11, padding: 12, borderWidth: 1, borderColor: '#D8E5EC', color: '#17232C', marginBottom: 9 }} />
              <TextInput value={draftEmail} onChangeText={setDraftEmail} placeholder="Email address" placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" style={{ backgroundColor: '#F8FAFC', borderRadius: 11, padding: 12, borderWidth: 1, borderColor: '#D8E5EC', color: '#17232C', marginBottom: 13 }} />
            </> : <>
              <TextInput value={draftAddressLine} onChangeText={setDraftAddressLine} placeholder="Street address" placeholderTextColor="#94A3B8" style={{ backgroundColor: '#F8FAFC', borderRadius: 11, padding: 12, borderWidth: 1, borderColor: '#D8E5EC', color: '#17232C', marginBottom: 9 }} />
              <TextInput value={draftAddressCity} onChangeText={setDraftAddressCity} placeholder="City, state, postal code" placeholderTextColor="#94A3B8" style={{ backgroundColor: '#F8FAFC', borderRadius: 11, padding: 12, borderWidth: 1, borderColor: '#D8E5EC', color: '#17232C', marginBottom: 13 }} />
            </>}
            <TouchableOpacity
              onPress={() => {
                if (editSection === 'contact') {
                  setBuyerName(draftName.trim());
                  setBuyerMobile(draftMobile.trim());
                  setBuyerEmail(draftEmail.trim());
                } else {
                  setAddressLine(draftAddressLine.trim());
                  setAddressCity(draftAddressCity.trim());
                }
                setEditSection(null);
              }}
              style={{ backgroundColor: '#168F87', borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center' }}
            ><Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>Save details</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={successModal} transparent animationType="fade" onRequestClose={() => setSuccessModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.85)', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 28, padding: 32, width: '100%', alignItems: 'center' }}>
            <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Check size={46} color="#10B981" strokeWidth={2.5} />
            </View>
            <Text style={{ fontSize: 26, fontWeight: '900', color: '#0F172A', marginBottom: 8, textAlign: 'center' }}>
              Preview Order Created
            </Text>
            <Text style={{ color: '#64748B', textAlign: 'center', fontSize: 14, lineHeight: 20, marginBottom: 8 }}>
              This is a local preview. No purchase, payment, or delivery has been created.
            </Text>
            <View style={{ backgroundColor: '#F0FFF4', borderRadius: 12, padding: 12, marginBottom: 24, width: '100%' }}>
              <Text style={{ color: '#065F46', fontWeight: '700', textAlign: 'center', fontSize: 13 }}>
                 {modelName}{'\n'}
                 Preview total: ₹{total.toLocaleString('en-IN')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => { setSuccessModal(false); router.replace('/(tabs)'); }}
              style={{ width: '100%' }}
            >
              <LinearGradient
                colors={['#00D1B2', '#05A894']}
                style={{ borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' }}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>Back to Dashboard 🏠</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
