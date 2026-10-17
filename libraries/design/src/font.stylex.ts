import * as stylex from '@stylexjs/stylex';

// The faces are self-hosted from Fontsource under the SIL Open Font License.

/**
 * Body text sets in `family`, titles and headings in `display-family` at `display-weight`, the
 * equation in the display face's Regular and italic. The brand face sets only the wordmark and the
 * landing page's headlines. Only capitals are tracked.
 */
export const font = stylex.defineVars({
  // Inter, then the system's sans.
  family: "'Inter Variable', 'Inter', system-ui, sans-serif",
  // Source Serif 4, its optical size axis cutting titles finer, then Georgia, whose proportions it shares.
  'display-family': "'Source Serif 4 Variable', 'Source Serif 4', Georgia, serif",
  // Cinzel, capitals cut after Roman inscriptions.
  'brand-family': "'Cinzel Variable', 'Cinzel', serif",
  'body-width': '100%',
  'body-weight': '400',
  // The weight WCAG 1.4.3 counts as bold for large-scale text.
  'bold-weight': '700',
  'display-width': '100%',
  'display-weight': '600',
  'brand-weight': '600',
  // Bringhurst's 5 to 10% for strings of capitals, the lower bound.
  'caps-tracking': '0.05em',
  'data-numerals': 'tabular-nums',
  // Inter's OS/2 cap height, 1490 of 2048 units: a mark beside capitals stands this × 1em tall.
  'cap-height': '0.728',
});
