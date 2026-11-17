// Frontend v9 — a designed make.fun client in a master-detail shell.
//
// The app is this directory's app/ folder: plain static files (ES modules
// and one stylesheet carried by the chrome module, no build step) that a
// browser opens at app/index.html and that read make.fun's public API at
// https://make.fun/api. A live board rail rides beside the bounty,
// leaderboard and profile views; the board itself keeps its toolbar and
// detail pane. This program hands the entry in: it copies app/ and
// screenshots/ from beside this file to the output directory and
// writes dossier.json there with the vendored make.fun library, byte for
// byte what the scorer's own copy writes. Leave vendor/ as it is.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps: at most 3 screenshots of 256 KiB, at most 993
// files and directories in app/ and 16 MiB of app files; only
// text_max_bytes shapes the dossier's text.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 3, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);

console.log('makefun-frontend-01-v9: app/ and screenshots/ copied to ' + out +
  '; dossier.json is ' + statSync(join(out, 'dossier.json')).size + ' bytes');
