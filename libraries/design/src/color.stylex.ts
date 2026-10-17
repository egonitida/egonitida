import * as stylex from '@stylexjs/stylex';

import { space } from './scale.stylex';

// Material 3's dynamic color: dark scheme, variant Fidelity, spec 2021, contrast 0. The primary
// palette takes the hue and chroma of the crimson #6b1219, the neutral palette those of parchment
// #f2e6c9, and the neutral variant palette the same hue at 4 more chroma. Each role is its palette's
// tone, resolved.

/**
 * `on-surface` and `on-surface-variant` read at 4.5:1 or more on every surface,
 * `on-primary-container` at 4.5:1 or more on `primary-container`, and `outline` at 3:1 or more on the
 * surface (WCAG 1.4.11). `outline-variant` is decorative only.
 */
export const color = stylex.defineVars({
  // Neutral tone 6.
  surface: '#181304',
  // Neutral tone 4.
  'surface-container-lowest': '#120e01',
  // Neutral tone 10.
  'surface-container-low': '#211b09',
  // Neutral tone 12.
  'surface-container': '#251f0d',
  // Neutral tone 17.
  'surface-container-high': '#302a17',
  // Neutral tone 22.
  'surface-container-highest': '#3b3420',
  // Neutral tone 90.
  'on-surface': '#eee2c5',
  // Neutral variant tone 80.
  'on-surface-variant': '#d3c6a0',
  // Neutral variant tone 60.
  outline: '#9c906e',
  // Neutral variant tone 30.
  'outline-variant': '#4f462a',
  // Primary tone 80.
  primary: '#ffb3b0',
  // Primary tone 20.
  'on-primary': '#640c14',
  // Primary tone 22.4, the source's own tone held by Fidelity.
  'primary-container': '#6b1219',
  // Primary tone 65.23, resolved for contrast with the container.
  'on-primary-container': '#f47978',
  // Neutral tone 0.
  scrim: '#000000',
});

/**
 * The brand's fixed colors, outside the dynamic scheme: on `fill`, `type` reads at 4.5:1 or more and
 * `mark` at 3:1 or more (WCAG 1.4.11). `frame` is decorative only.
 */
export const brand = stylex.defineVars({
  // The primary source itself.
  fill: '#6b1219',
  frame: '#8a6a22',
  mark: '#d4af37',
  type: '#f2e6c9',
  // The lowest alpha keeping `type` at 4.5:1 and `mark` at 3:1 over pure white in sRGB: 0.7549, rounded up.
  'translucent-fill': 'rgba(107, 18, 25, 0.755)',
});

export const focus = stylex.defineVars({
  // The primary role, at 10.9:1 on the surface the ring floats over.
  color: '#ffb3b0',
  // WCAG 2.4.13's minimum, a 2px perimeter.
  width: '2px',
  offset: '2px',
});

export const chrome = stylex.defineVars({
  // The surface at the lowest alpha whose tone over pure white stays at or under tone 22, the lightest
  // surface role: 0.8581, rounded up. Bar text keeps 4.5:1 over anything beneath.
  fill: 'rgba(24, 19, 4, 0.859)',
  // One body line, so text beneath is never legible.
  blur: `blur(${space.m})`,
});
