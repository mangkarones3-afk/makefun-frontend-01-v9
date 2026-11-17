# makefun-frontend-01-v9

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/mangkarones3-afk/makefun-frontend-01-v9/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/mangkarones3-afk/makefun-frontend-01-v9/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A designed make.fun client that boots from a 411-byte shell (282 B at gzip-9) into a master-detail layout: on wide screens a live board rail rides beside every bounty, leaderboard and profile, so the whole board stays one click away while you read. The board itself works like a pit-wall timing board — live bounties beside their detail pane, a ticking deadline clock, and a toolbar (search, status filters, sorting) that runs entirely on the board data already loaded, so filtering costs no API requests. Keyboard shortcuts throughout: press `/` to search the board, arrow keys to walk the rail or the board list, Enter to open a bounty. Around it sit a bounty's own page with its rules and rewards, a windowed leaderboard with medals for the top three, and public profiles. Every view reads through one shared cache: answers stay fresh 45 seconds, then revalidate by ETag, and identical requests in flight are shared — the header's live bar shows those counters working. The rail reads through the same cache, so it costs no requests of its own. No framework, no build step; each route loads only its own module.

## Run it

```sh
python3 -m http.server 8080 -d app
```

Then open http://localhost:8080. To build the hand-in dossier instead:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=ram1fzcx&utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
