import * as stylex from '@stylexjs/stylex';

// Material 3's baseline motion tokens, verbatim (m3.material.io, Motion: easing and duration).

/**
 * State changes run `short4` on `standard`, entering elements `medium4` on `emphasized-decelerate`,
 * leaving elements `short4` on `emphasized-accelerate`. Under `prefers-reduced-motion` only
 * transforms are dropped, as WCAG 2.3.3 asks.
 */
export const duration = stylex.defineVars({
  short1: '50ms',
  short2: '100ms',
  short3: '150ms',
  short4: '200ms',
  medium1: '250ms',
  medium2: '300ms',
  medium3: '350ms',
  medium4: '400ms',
  long1: '450ms',
  long2: '500ms',
  long3: '550ms',
  long4: '600ms',
  'extra-long1': '700ms',
  'extra-long2': '800ms',
  'extra-long3': '900ms',
  'extra-long4': '1000ms',
});

export const easing = stylex.defineVars({
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  'standard-decelerate': 'cubic-bezier(0, 0, 0, 1)',
  'standard-accelerate': 'cubic-bezier(0.3, 0, 1, 1)',
  'emphasized-decelerate': 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  'emphasized-accelerate': 'cubic-bezier(0.3, 0, 0.8, 0.15)',
  // Material 2's standard curve.
  legacy: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // For color and opacity fades that should not ease.
  linear: 'cubic-bezier(0, 0, 1, 1)',
});
