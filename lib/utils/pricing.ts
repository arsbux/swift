/**
 * Pricing Engine
 * Rule-based pricing calculation based on deliverable type and deadline
 */

import type { DeliverableType, JobPriority } from '@/lib/supabase/types';

interface PricingOptions {
  deliverableType: DeliverableType;
  deadlineHours: number;
  priority?: JobPriority;
}

interface PriceEstimate {
  basePrice: number;
  deadlineMultiplier: number;
  priorityMultiplier: number;
  estimatedPrice: number;
  fastPrice?: number; // If priority is fast
}

// Base prices by deliverable type
const BASE_PRICES: Record<DeliverableType, number> = {
  landing_page: 150,
  ad_1min: 200,
  bug_fix: 100,
  design: 250,
  other: 150,
};

// Deadline multipliers
const DEADLINE_MULTIPLIERS: Record<string, number> = {
  '24': 1.5,  // +50% for 24 hours
  '48': 1.25, // +25% for 48 hours
  '72': 1.0,  // Base price for 72 hours
};

// Priority multiplier
const PRIORITY_MULTIPLIER = 1.2; // +20% for fast priority

/**
 * Calculate price estimate based on deliverable type, deadline, and priority
 */
export function calculatePriceEstimate(options: PricingOptions): PriceEstimate {
  const { deliverableType, deadlineHours, priority = 'normal' } = options;
  
  const basePrice = BASE_PRICES[deliverableType] || BASE_PRICES.other;
  
  // Determine deadline multiplier
  let deadlineMultiplier = 1.0;
  if (deadlineHours <= 24) {
    deadlineMultiplier = DEADLINE_MULTIPLIERS['24'];
  } else if (deadlineHours <= 48) {
    deadlineMultiplier = DEADLINE_MULTIPLIERS['48'];
  } else if (deadlineHours <= 72) {
    deadlineMultiplier = DEADLINE_MULTIPLIERS['72'];
  } else {
    // For deadlines longer than 72 hours, use base price
    deadlineMultiplier = 1.0;
  }
  
  // Calculate priority multiplier
  const priorityMultiplier = priority === 'fast' ? PRIORITY_MULTIPLIER : 1.0;
  
  // Calculate estimated price
  const estimatedPrice = Math.round(basePrice * deadlineMultiplier * priorityMultiplier);
  
  // Calculate fast price (if priority is normal, show what fast would cost)
  const fastPrice = priority === 'normal' 
    ? Math.round(basePrice * deadlineMultiplier * PRIORITY_MULTIPLIER)
    : undefined;
  
  return {
    basePrice,
    deadlineMultiplier,
    priorityMultiplier,
    estimatedPrice,
    fastPrice,
  };
}

/**
 * Get human-readable deadline label
 */
export function getDeadlineLabel(hours: number): string {
  if (hours <= 24) return '24 hours';
  if (hours <= 48) return '48 hours';
  if (hours <= 72) return '72 hours';
  const days = Math.ceil(hours / 24);
  return `${days} days`;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `$${price.toLocaleString()}`;
}

