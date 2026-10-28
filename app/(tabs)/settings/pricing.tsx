import { useState } from 'react';
import {
  Alert, Modal, ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronRight, ShieldCheck, X } from 'lucide-react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter, type Href } from 'expo-router';
import { usePlan, type BillingPeriod, type PlanId } from '../../../contexts/plan-context';
import { SafeAreaView } from 'react-native-safe-area-context';

type Plan = {
  id: PlanId;
  name: string;
  monthly: number;
  yearly: number;
  saving?: string;
  badges: string[];
  features: string[];
  action: string;
};

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'AsonyxAI Free',
    monthly: 0,
    yearly: 0,
    badges: ['STARTER'],
    features: [
      'Basic helmet connectivity',
      'Standard GPS navigation',
      'Manual SOS alerts',
      '7-day ride history',
      'Community forum access',
    ],
    action: 'Choose Free Plan',
  },
  {
    id: 'basic',
    name: 'AsonyxAI Basic',
    monthly: 499,
    yearly: 4799,
    saving: 'Save 20%',
    badges: ['ESSENTIAL'],
    features: [
      'Everything in Free',
      'AI voice commands',
      'Auto crash detection',
      '30-day cloud video storage',
      'Priority email support',
      'Real-time weather alerts',
    ],
    action: 'Upgrade to Basic',
  },
  {
    id: 'pro',
    name: 'AsonyxAI Pro',
    monthly: 999,
    yearly: 8999,
    saving: 'Save 25%',
    badges: ['PRO TACTICAL', 'RECOMMENDED', '30-DAY FREE TRIAL'],
    features: [
      'Everything in Basic, plus',
      'Ad-free premium system experience',
      'Priority immediate SOS emergency response',
      'Unlimited cloud video recording storage',
      'Advanced AI hazard prediction algorithms',
      'Real-time dynamic traffic routing',
      '24/7 dedicated support priority hotline',
      'Live helmet diagnostics & health monitoring',
      'Multi-rider group tracking & communication',
      'Night vision HUD enhancement mode',
      'Predictive route safety scoring',
    ],
    action: 'Subscribe Now',
  },
];

function formatPrice(amount: number) {
  return amount === 0 ? '₹0' : `₹${amount.toLocaleString('en-IN')}`;
}

function PlanCard({ plan, selected, billingPeriod, onSelect }: { plan: Plan; selected: boolean; billingPeriod: BillingPeriod; onSelect: () => void }) {
  const isPro = plan.id === 'pro';
  const yearly = billingPeriod === 'yearly';
  const displayedPrice = yearly ? plan.yearly : plan.monthly;
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 17, padding: 15, marginBottom: 13, borderWidth: isPro ? 1.5 : 1, borderColor: isPro ? '#D9C477' : '#D8E5EC', shadowColor: '#0F172A', shadowOpacity: 0.045, shadowRadius: 8, elevation: 2 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {plan.badges.map((badge, index) => (
          <View key={badge} style={{ borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: index === 0 && isPro ? '#DCC16E' : index === 1 ? '#DFF4F2' : '#EFF5F8' }}>
            <Text style={{ color: index === 0 && isPro ? '#453A1F' : '#52717A', fontSize: 8, fontWeight: '800', letterSpacing: 0.35 }}>{badge}</Text>
          </View>
        ))}
      </View>

      <Text style={{ color: '#111C22', fontSize: 19, fontWeight: '900' }}>{plan.name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
        <Text style={{ color: isPro ? '#BEA253' : '#168F87', fontSize: 24, fontWeight: '900' }}>{formatPrice(displayedPrice)}</Text>
        <Text style={{ color: '#52616B', fontSize: 11, marginLeft: 4 }}>/ {yearly ? 'year' : 'month'}</Text>
      </View>
      {!!plan.saving && <Text style={{ color: '#52616B', fontSize: 10, marginTop: 2 }}>{yearly ? `${formatPrice(Math.round(plan.yearly / 12))}/month billed yearly · ${plan.saving}` : `or ${formatPrice(plan.yearly)}/year · ${plan.saving}`}</Text>}

      <View style={{ height: 1, backgroundColor: '#E7EDF0', marginVertical: 10 }} />
      {plan.features.map(feature => (
        <View key={feature} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 7 }}>
          <Check size={12} color={isPro ? '#B59A4A' : '#2CACA0'} strokeWidth={2.6} style={{ marginTop: 1 }} />
          <Text style={{ color: '#33434B', fontSize: 10, lineHeight: 14, flex: 1 }}>{feature}</Text>
        </View>
      ))}

      <TouchableOpacity onPress={onSelect} activeOpacity={0.85} style={{ marginTop: 9, borderRadius: 10, minHeight: 39, overflow: 'hidden', borderWidth: plan.id === 'free' ? 1 : 0, borderColor: '#D8E1E5', backgroundColor: plan.id === 'free' ? '#FFFFFF' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {plan.id !== 'free' && <LinearGradient colors={isPro ? ['#CFB664', '#21C9C9'] : ['#29CBCD', '#20C7CB']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />}
        <Text style={{ color: plan.id === 'free' ? '#17232C' : '#08282A', fontSize: 11, fontWeight: '900' }}>{selected ? `Current · ${yearly ? 'Yearly' : 'Monthly'}` : plan.action}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PricingScreen() {
  const router = useRouter();
  const { selectedPlanId, billingPeriod, isPlanLoaded, selectPlan, setBillingPeriod } = usePlan();
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingPeriod, setSavingPeriod] = useState(false);

  const choosePlan = (plan: Plan) => {
    if (!isPlanLoaded) return;
    if (plan.id === selectedPlanId) {
      Alert.alert('Current plan', `${plan.name} is selected for this on-device preview.`);
      return;
    }
    setPendingPlan(plan);
  };

  const confirmPreview = async () => {
    if (!pendingPlan) return;
    setSavingPlan(true);
    try {
      await selectPlan(pendingPlan.id as PlanId);
      Alert.alert('Plan selected for preview', `${pendingPlan.name} is saved on this device. No payment or subscription was started.`);
      setPendingPlan(null);
    } catch {
      Alert.alert('Could not save plan', 'Your plan choice could not be saved on this device. Please try again.');
    } finally {
      setSavingPlan(false);
    }
  };

  const changeBillingPeriod = async (period: BillingPeriod) => {
    if (!isPlanLoaded || savingPeriod || period === billingPeriod) return;
    setSavingPeriod(true);
    try {
      await setBillingPeriod(period);
    } catch {
      Alert.alert('Could not save billing period', 'Your monthly or yearly preference could not be saved on this device. Please try again.');
    } finally {
      setSavingPeriod(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#EEF7FD' }}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 15, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 3, paddingTop: 6, paddingBottom: 12 }}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/settings')} accessibilityLabel="Back to settings" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8E5EC', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={18} color="#17232C" /></TouchableOpacity>
          <View style={{ flex: 1 }}>
          <Text style={{ color: '#17232C', fontSize: 22, fontWeight: '900' }}>Plans & Pricing</Text>
        <Text style={{ color: '#64748B', fontSize: 12, marginTop: 3 }}>Compare plans and choose your AsonyxAI option</Text>
          </View>
        </View>

        {!isPlanLoaded && <Text style={{ color: '#64748B', textAlign: 'center', paddingVertical: 10 }}>Loading your saved plan…</Text>}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 13, borderWidth: 1, borderColor: '#D8E5EC', padding: 4, flexDirection: 'row', marginBottom: 13 }}>
          {([
            { id: 'monthly' as const, label: 'Monthly' },
            { id: 'yearly' as const, label: 'Yearly · Save up to 25%' },
          ]).map(option => {
            const active = billingPeriod === option.id;
            return <TouchableOpacity key={option.id} disabled={!isPlanLoaded || savingPeriod} onPress={() => changeBillingPeriod(option.id)} accessibilityRole="button" accessibilityState={{ selected: active }} style={{ flex: 1, minHeight: 42, borderRadius: 10, backgroundColor: active ? '#168F87' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', opacity: savingPeriod ? 0.7 : 1 }}>
              <Text style={{ color: active ? '#FFFFFF' : '#52616B', fontSize: 11, fontWeight: '800' }}>{option.label}</Text>
            </TouchableOpacity>;
          })}
        </View>
        <Text style={{ color: '#64748B', fontSize: 10, textAlign: 'center', marginTop: -7, marginBottom: 12 }}>{billingPeriod === 'yearly' ? 'Annual prices are billed once per year.' : 'Monthly prices are billed every month.'} Switch anytime to compare.</Text>
        {PLANS.map(plan => <PlanCard key={plan.id} plan={plan} selected={selectedPlanId === plan.id} billingPeriod={billingPeriod} onSelect={() => choosePlan(plan)} />)}

        <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8E5EC', borderRadius: 16, padding: 13, marginTop: 1 }}>
          <Text style={{ color: '#17232C', fontSize: 13, fontWeight: '900' }}>Plan preview</Text>
          <Text style={{ color: '#64748B', fontSize: 10, lineHeight: 14, marginTop: 4 }}>Plans and prices are for UI preview. Payments, subscriptions, cloud storage, and plan-specific access are not connected yet.</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
            {['On-device preview', 'No billing connected', 'Plans can be changed'].map(item => <Text key={item} style={{ color: '#3F6D72', backgroundColor: '#E8F6F5', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 5, fontSize: 8, fontWeight: '700' }}>{item}</Text>)}
          </View>
        </View>

        <View style={{ marginTop: 12, padding: 12, borderRadius: 15, backgroundColor: '#E6F4F7' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><ShieldCheck size={16} color="#168F87" /><Text style={{ color: '#17232C', fontSize: 11, fontWeight: '800' }}>Built for every ride</Text></View>
          <Text style={{ color: '#64748B', fontSize: 9, marginTop: 4 }}>Compare safety features, then select a plan for this local preview.</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 14, paddingTop: 13 }}>
          {[
            { label: 'Privacy Policy', route: '/settings/privacy' as const },
            { label: 'Terms', route: '/settings/terms' as const },
            { label: 'Support', route: '/settings/help' as const },
            { label: 'Contact', route: '/settings/contact' as const },
          ].map(({ label, route }) => (
            <TouchableOpacity key={label} onPress={() => router.push(route as Href)}>
              <Text style={{ color: '#53666F', fontSize: 9, textDecorationLine: 'underline' }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ color: '#80909A', textAlign: 'center', fontSize: 8, marginTop: 9 }}>© 2026 AsonyxAI. All rights reserved.</Text>
      </ScrollView>

      <Modal visible={!!pendingPlan} transparent animationType="slide" onRequestClose={() => { if (!savingPlan) setPendingPlan(null); }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#F3F9FC', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ color: '#17232C', fontSize: 18, fontWeight: '900' }}>Preview {pendingPlan?.name}</Text>
              <TouchableOpacity onPress={() => !savingPlan && setPendingPlan(null)} accessibilityLabel="Close plan preview"><X size={20} color="#64748B" /></TouchableOpacity>
            </View>
            <Text style={{ color: '#64748B', fontSize: 13, lineHeight: 19, marginBottom: 15 }}>Select {pendingPlan && formatPrice(billingPeriod === 'yearly' ? pendingPlan.yearly : pendingPlan.monthly)} per {billingPeriod === 'yearly' ? 'year' : 'month'} for this device preview. No payment or subscription will be started.</Text>
            <TouchableOpacity onPress={confirmPreview} disabled={savingPlan} style={{ minHeight: 48, backgroundColor: '#24C6C9', borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, opacity: savingPlan ? 0.7 : 1 }}>
              <Text style={{ color: '#08282A', fontWeight: '900' }}>{savingPlan ? 'Saving plan…' : 'Select for Preview'}</Text>{!savingPlan && <ChevronRight size={16} color="#08282A" />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => !savingPlan && setPendingPlan(null)} style={{ alignItems: 'center', padding: 11, marginTop: 3 }}><Text style={{ color: '#64748B', fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
