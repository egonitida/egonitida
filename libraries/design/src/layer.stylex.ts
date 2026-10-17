import * as stylex from '@stylexjs/stylex';

/** The page's stacking order, bottom to top. */
export const layer = stylex.defineVars({
  content: '0',
  // Under the menu, which covers it while open.
  banner: '1',
  overlay: '2',
  chrome: '3',
  // Over the bar it sits in, once focused.
  'skip-link': '4',
});
