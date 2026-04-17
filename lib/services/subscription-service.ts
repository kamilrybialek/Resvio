import { UserProfile } from '@/lib/types';
import { ProfileService } from './profile-service';

/**
 * Subscription plans and their CV credit allocations.
 * Credits are consumed on each AI CV generation / cover letter.
 */
export const PLANS = {
  free:    { label: 'Free',    cvCredits: 3,  price: 0 },
  starter: { label: 'Starter', cvCredits: 10, price: 3.99 },
  growth:  { label: 'Growth',  cvCredits: 30, price: 8.99 },
  pro:     { label: 'Pro',     cvCredits: 50, price: 12.99 },
} as const;

export type PlanId = keyof typeof PLANS;

export class SubscriptionService {
  /**
   * Returns true if the user has a paid plan (starter, growth, or pro).
   * In the current phase, AI match scoring is available to ALL users.
   * When the gate is activated, only paid users will have access.
   */
  static isPremium(profile?: UserProfile | null): boolean {
    if (!profile) return false;
    const plan = profile.subscription?.plan ?? 'free';
    return plan !== 'free';
  }

  /**
   * Returns true if the user can still generate AI CVs (has credits remaining).
   * Free users get 3 credits by default.
   */
  static canGenerateCV(profile?: UserProfile | null): boolean {
    if (!profile) return false;
    const credits = profile.subscription?.cvCredits ?? PLANS.free.cvCredits;
    return credits > 0;
  }

  /**
   * Returns remaining CV credits.
   */
  static getRemainingCredits(profile?: UserProfile | null): number {
    if (!profile) return 0;
    return profile.subscription?.cvCredits ?? PLANS.free.cvCredits;
  }

  /**
   * Returns the user's current plan id.
   */
  static getPlan(profile?: UserProfile | null): PlanId {
    return (profile?.subscription?.plan ?? 'free') as PlanId;
  }

  /**
   * Deducts one CV credit from the profile and saves it.
   * Returns false if no credits remaining.
   */
  static consumeCredit(): boolean {
    const profile = ProfileService.getProfile();
    if (!profile) return false;

    const currentCredits = profile.subscription?.cvCredits ?? PLANS.free.cvCredits;
    if (currentCredits <= 0) return false;

    const updated: UserProfile = {
      ...profile,
      subscription: {
        plan: profile.subscription?.plan ?? 'free',
        cvCredits: currentCredits - 1,
        expiresAt: profile.subscription?.expiresAt,
        activatedAt: profile.subscription?.activatedAt,
      },
    };
    ProfileService.saveProfile(updated);
    return true;
  }

  /**
   * Activates a plan for the user (called after successful payment).
   * In the future, this will be triggered by Stripe webhook.
   */
  static activatePlan(planId: PlanId): void {
    const profile = ProfileService.getProfile();
    if (!profile) return;

    const plan = PLANS[planId];
    const updated: UserProfile = {
      ...profile,
      subscription: {
        plan: planId,
        cvCredits: plan.cvCredits,
        activatedAt: new Date().toISOString(),
      },
    };
    ProfileService.saveProfile(updated);
  }
}
