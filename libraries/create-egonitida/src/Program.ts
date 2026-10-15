import { Console } from 'effect';
import manifest from '#package.json' with { type: 'json' };

/** A place to find EgoNitida: what it is called, and where it is. */
export interface Channel {
  readonly label: string;
  readonly url: string;
}

/** Where to find EgoNitida, in the order `npm create egonitida` lists them. */
export const channels: ReadonlyArray<Channel> = [
  { label: 'Website', url: 'https://egonitida.com' },
  { label: 'Source', url: 'https://github.com/egonitida/egonitida' },
  { label: 'Packages', url: 'https://npmjs.com/org/egonitida' },
  { label: 'Discord', url: 'https://discord.gg/6zsggGTGZf' },
  { label: 'X', url: 'https://x.com/egonitida' },
  { label: 'Instagram', url: 'https://instagram.com/egonitida' },
  { label: 'Threads', url: 'https://threads.com/@egonitida' },
];

/** `channels` as lines, indented, each label padded to the longest so their addresses line up. */
const listed = (listing: ReadonlyArray<Channel>): ReadonlyArray<string> => {
  const width = Math.max(...listing.map(({ label }) => label.length));
  return listing.map(({ label, url }) => `  ${label.padEnd(width)}  ${url}`);
};

/** What `npm create egonitida` prints: create-egonitida at the version published, what EgoNitida is, and where to find it, written to the console. */
export const program = Console.log(
  [
    `create-egonitida ${manifest.version}`,
    'A real-time 3D engine built on Effect, Three.js, and Foldkit.',
    '',
    ...listed(channels),
    '',
  ].join('\n'),
);
