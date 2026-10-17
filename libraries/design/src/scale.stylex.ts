import * as stylex from '@stylexjs/stylex';

// The axioms: the only hand-chosen numbers, every token derives from them.

// WCAG 1.4.10 Reflow's 320 CSS px.
const MIN_VIEWPORT_PX = 320;
const MAX_VIEWPORT_PX = 1280;
// The browser default and Material 3's Body Large.
const MIN_STEP_0_PX = 16;
// Utopia's default.
const MAX_STEP_0_PX = 20;
// Utopia's default minor third.
const MIN_RATIO = 6 / 5;
// Utopia's default major third.
const MAX_RATIO = 5 / 4;
// WCAG 1.4.8, and Material 3's Body Large at 16/24.
const BODY_LINE_HEIGHT = 1.5;
// Bringhurst's ideal, within WCAG 1.4.8's 80 characters.
const MEASURE = '66ch';
// Material 3's top app bar at 64dp.
const HEADER_HEIGHT_REM = 4;
// Material 3's 48dp, above WCAG 2.5.5's 44px.
const TOUCH_TARGET_REM = 3;
// Material 3's 24dp icon.
const ICON_REM = 1.5;

// Utopia's fluid interpolation, in rem + vw so browser zoom scales it.

const PX_PER_REM = 16;

const round = (value: number): number => Math.round(value * 10000) / 10000;

const rem = (px: number): string => `${round(px / PX_PER_REM)}rem`;

const slope = (minPx: number, maxPx: number): number =>
  (maxPx - minPx) / (MAX_VIEWPORT_PX - MIN_VIEWPORT_PX);

const intercept = (minPx: number, maxPx: number): number =>
  minPx - slope(minPx, maxPx) * MIN_VIEWPORT_PX;

const fluid = (minPx: number, maxPx: number): string =>
  `clamp(${rem(minPx)}, ${rem(intercept(minPx, maxPx))} + ${round(slope(minPx, maxPx) * 100)}vw, ${rem(maxPx)})`;

const minStep = (n: number): number => MIN_STEP_0_PX * MIN_RATIO ** n;

const maxStep = (n: number): number => MAX_STEP_0_PX * MAX_RATIO ** n;

// Each step interpolates between its own two end values, Utopia's method, not an interpolated ratio.
const step = (n: number): string => fluid(minStep(n), maxStep(n));

// Space `2xs`, which sets step 0 at exactly the body line height.
const minLineGap = MIN_STEP_0_PX * (BODY_LINE_HEIGHT - 1);
const maxLineGap = MAX_STEP_0_PX * (BODY_LINE_HEIGHT - 1);

const lineHeight = (n: number): string => fluid(minStep(n) + minLineGap, maxStep(n) + maxLineGap);

const single = (multiplier: number): string =>
  fluid(MIN_STEP_0_PX * multiplier, MAX_STEP_0_PX * multiplier);

const pair = (from: number, to: number): string => fluid(MIN_STEP_0_PX * from, MAX_STEP_0_PX * to);

// Utopia's space multipliers of step 0.
const SPACE_3XS = 0.25;
const SPACE_2XS = 0.5;
const SPACE_XS = 0.75;
const SPACE_S = 1;
const SPACE_M = 1.5;
const SPACE_L = 2;
const SPACE_XL = 3;
const SPACE_2XL = 4;
const SPACE_3XL = 6;

export const type = stylex.defineVars({
  'step--2': step(-2),
  'step--1': step(-1),
  'step-0': step(0),
  'step-1': step(1),
  'step-2': step(2),
  'step-3': step(3),
  'step-4': step(4),
  'step-5': step(5),
});

/**
 * One length per step, not a shared `calc(1em + …)`: a length line height inherits as its computed
 * px value, so a child at another step would take its parent's.
 */
export const leading = stylex.defineVars({
  'step--2': lineHeight(-2),
  'step--1': lineHeight(-1),
  'step-0': lineHeight(0),
  'step-1': lineHeight(1),
  'step-2': lineHeight(2),
  'step-3': lineHeight(3),
  'step-4': lineHeight(4),
  'step-5': lineHeight(5),
});

export const space = stylex.defineVars({
  '3xs': single(SPACE_3XS),
  '2xs': single(SPACE_2XS),
  xs: single(SPACE_XS),
  s: single(SPACE_S),
  m: single(SPACE_M),
  l: single(SPACE_L),
  xl: single(SPACE_XL),
  '2xl': single(SPACE_2XL),
  '3xl': single(SPACE_3XL),
  '3xs-2xs': pair(SPACE_3XS, SPACE_2XS),
  '2xs-xs': pair(SPACE_2XS, SPACE_XS),
  'xs-s': pair(SPACE_XS, SPACE_S),
  's-m': pair(SPACE_S, SPACE_M),
  'm-l': pair(SPACE_M, SPACE_L),
  'l-xl': pair(SPACE_L, SPACE_XL),
  'xl-2xl': pair(SPACE_XL, SPACE_2XL),
  '2xl-3xl': pair(SPACE_2XL, SPACE_3XL),
  's-l': pair(SPACE_S, SPACE_L),
});

/**
 * Utopia's defaults. On narrow screens blocks span multiples of three columns, Material 3's
 * four-column compact grid. Tables do not use it.
 */
export const grid = stylex.defineVars({
  columns: '12',
  gutter: pair(SPACE_S, SPACE_L),
  gap: pair(SPACE_S, SPACE_L),
  'max-width': rem(MAX_VIEWPORT_PX),
});

export const layout = stylex.defineVars({
  measure: MEASURE,
  // A literal name, so stylesheets outside StyleX can read it with `var()`.
  '--layout-header-height': `${HEADER_HEIGHT_REM}rem`,
  'touch-target': `${TOUCH_TARGET_REM}rem`,
  icon: `${ICON_REM}rem`,
  // Centres a touch target in the header.
  'header-padding-block': `${(HEADER_HEIGHT_REM - TOUCH_TARGET_REM) / 2}rem`,
});

export const tableRow = stylex.defineVars({
  // A row of step 0 text then stands exactly space `xl`.
  'padding-block': single(SPACE_XS),
});
