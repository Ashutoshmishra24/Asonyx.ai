import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { File, Paths } from 'expo-file-system';

export type PlanId = 'free' | 'basic' | 'pro';
export type BillingPeriod = 'monthly' | 'yearly';

const PLAN_STORAGE = new File(Paths.document, 'asonyx-selected-plan.json');
const LEGACY_PLAN_STORAGE = new File(Paths.document, 'asonyx-selected-plan.txt');
const VALID_PLAN_IDS: PlanId[] = ['free', 'basic', 'pro'];
const VALID_BILLING_PERIODS: BillingPeriod[] = ['monthly', 'yearly'];

type PlanContextValue = {
  selectedPlanId: PlanId;
  billingPeriod: BillingPeriod;
  isPlanLoaded: boolean;
  selectPlan: (planId: PlanId) => Promise<void>;
  setBillingPeriod: (period: BillingPeriod) => Promise<void>;
};

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('free');
  const [billingPeriod, setBillingPeriodState] = useState<BillingPeriod>('monthly');
  const [isPlanLoaded, setIsPlanLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadPlan = async () => {
      try {
        const sourceFile = PLAN_STORAGE.exists ? PLAN_STORAGE : LEGACY_PLAN_STORAGE;
        if (sourceFile.exists) {
          const savedPlan = (await sourceFile.text()).trim();
          let parsed: { planId?: unknown; billingPeriod?: unknown } | null = null;
          try {
            parsed = JSON.parse(savedPlan) as { planId?: unknown; billingPeriod?: unknown };
          } catch {
            // Read the earlier plain-text plan selection format if this device has one.
          }
          if (mounted && parsed && VALID_PLAN_IDS.includes(parsed.planId as PlanId)) {
            setSelectedPlanId(parsed.planId as PlanId);
            if (VALID_BILLING_PERIODS.includes(parsed.billingPeriod as BillingPeriod)) {
              setBillingPeriodState(parsed.billingPeriod as BillingPeriod);
            }
          } else if (mounted && VALID_PLAN_IDS.includes(savedPlan as PlanId)) {
            setSelectedPlanId(savedPlan as PlanId);
          }
        }
      } catch {
        // The app remains usable with the default Free preview if local storage is unavailable.
      } finally {
        if (mounted) setIsPlanLoaded(true);
      }
    };

    void loadPlan();
    return () => { mounted = false; };
  }, []);

  const saveChoice = useCallback(async (planId: PlanId, period: BillingPeriod) => {
    if (!PLAN_STORAGE.exists) PLAN_STORAGE.create({ intermediates: true });
    await PLAN_STORAGE.write(JSON.stringify({ planId, billingPeriod: period }));
  }, []);

  const selectPlan = useCallback(async (planId: PlanId) => {
    if (!VALID_PLAN_IDS.includes(planId)) throw new Error('Unknown plan selected.');
    await saveChoice(planId, billingPeriod);
    setSelectedPlanId(planId);
  }, [billingPeriod, saveChoice]);

  const setBillingPeriod = useCallback(async (period: BillingPeriod) => {
    if (!VALID_BILLING_PERIODS.includes(period)) throw new Error('Unknown billing period selected.');
    await saveChoice(selectedPlanId, period);
    setBillingPeriodState(period);
  }, [saveChoice, selectedPlanId]);

  const value = useMemo(() => ({ selectedPlanId, billingPeriod, isPlanLoaded, selectPlan, setBillingPeriod }), [selectedPlanId, billingPeriod, isPlanLoaded, selectPlan, setBillingPeriod]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const value = useContext(PlanContext);
  if (!value) throw new Error('usePlan must be used within PlanProvider.');
  return value;
}
