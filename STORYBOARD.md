# CONFITEOR (BE HONEST) — storyboard v2

Every shot is keyed to a **sung word**, not a time: the film reads word times from the chosen take,
so a new take re-times the whole edit. `P##` is a plate (`plates.json`); `M` marks a shot that gets a
Grok Imagine clip; the rest are plates moved in 2.5D (camera through depth and mattes). All type,
numbers, interfaces and marks are drawn by the engine; no generated image carries readable text.

## The rules every shot keeps

- **One accent**: vermilion (`#E04A2B`) is the rubric, the thread, the failing test, the stamp, the
  key word of a line. Everything else is ink and vellum. Ticks are drawn ivory, never green.
- **Type travels in time**: blackletter (UnifrakturMaguntia) for 1492 and for "Be honest"; IBM Plex
  Sans for the Machine's voice and the Scribe's lines; Anton for the crowd (MEA CULPA!, DEPRECATED,
  I DID!); IBM Plex Mono for readouts and sources.
- **Tuck an edge, never lose a glyph, never cross a face.**
- **Cuts land on words or kicks; camera pushes ride the risers into the drop**; full-frame flashes
  only on the crowd's shouts, never more than 3 a second (WCAG 2.3.1 general flash threshold).
- **The HUD is the clock**: top-right the place and the year, rolling 1492 ↔ 2026 on every match cut;
  bottom-left a readout that explains the shot.
- **The candle is the throughline**: lit in the intro, carried into daylight in the flip, put out on
  "Thank you".

## What changed once the song existed (v2)

The master take (v2-44) has three full-energy **instrumental drops** the plan did not know about:
72–81 s, 129–137 s and 182–193 s, each four-on-the-floor at 123 BPM. v1 held one plate through
each for ten seconds. v2 cuts them as **montages on the measured kicks** (`montage()` in
`film.js`), each one answering the film's question in pictures:

- **after chorus 1, "the press runs":** 1492 and 2026 alternate every two kicks; a counter doubles
  on every cut, `×2 … ×256`.
- **after chorus 2, "the confession, compressed":** every ritual seen so far, one per two kicks
  (`CHECKED BY EYE`, `LGTM`, `WORKS ON MY MACHINE`, `FRIDAY 18:47`…), then one per kick in 1492,
  then a hard cut to the window as the beat stops: the bridge.
- **after "I did":** the presses and the racks at sunrise with his candle between them; the copies
  keep doubling past a million; the candle goes out on "Thank you"; the door opens on a kick.

And 021 became **the meme itself**: as the confessional lattice closes on the riser, it turns into
the meme's 3×2 grid, the Scribe confessing on the left ("I wrote tests", "Ok, I ran it once", "I
pushed it straight to prod"), the Abbot at the door on the right ("Be honest", "Be honest", "Thank
you"), the panels landing one by one into the drop. The chorus that follows is its answer.

The bridge's "beat stops" happens at 136.9 s in this take, not at the section boundary, so the
window shot starts there.

## I · The confession (intro, black → candle night)

Built and approved as probe 3 (`renders/intro-probe-v1.mp4`).

| # | on | plate | shot | type |
|---|---|---|---|---|
| 001 | "Confiteor" | — | black | **Confiteor** blackletter, `I CONFESS` mono beneath |
| 002 | "I wrote" | P02 M | 1492: finger on the line, freezes, looks up at the door | "I wrote… **tests.**" + rubric underline |
| 003 | "Be honest" | P04 M | the Abbot peeks round the door: the meme, transposed | **Be honest.** tucked behind his hood |
| 004 | "Okay" | P03 | match cut, 2026, same man, same pose; year rolls | "Okay. I ran it. **Once.**" · `TEST RUNS 1` |
| 005 | "Be honest" | P04 M | the Abbot, close | **Be honest.** |
| 006 | "I pushed" | P03 | the hands, the printout | "I pushed it straight to **prod.**" · `git push --no-verify` typed · punch on "prod" |
| 007 | "Thank you" | P05 | the press nave, dark, a slow push | "Thank you." small, centred |

## II · Mainz (verse 1, candle night, 1492)

| # | on | plate | shot | type |
|---|---|---|---|---|
| 008 | "Mainz" (the beat drops) | P05 | press nave, a camera punch on the clank | **MAINZ,** Anton, then `1492` rolls in mono |
| 009 | "Three a.m." | P01 M | candle macro, the flame trembles on the kick | "Three a.m. One candle." |
| 010 | "The abbot" | P07 M | the Abbot writing his treatise by candle | "The abbot writes **against the press**:" |
| 011 | "too fast" | P12 | the press in darkness, iron screw, a whip pan | "too fast, too much to handle." |
| 012 | "A copy" | P09 | the old world at scale: rows of monks copying | "A copy made by hand will last **a thousand years.**" · counter `PAGES / DAY · 1` |
| 013 | "A monk" | P10 | a monk, hands folded over his page | "A monk who copies, **prays.**" |
| 014 | "Wipe" | P11 M | the scribe rubs his eyes with inked fingers; a smear of ink under his eye | "Wipe the ink away. Wipe the tears." |
| 015 | "He writes" | P08 M | quill nib macro, blackletter forming in wet ink | "He writes it all **by hand**, with love," — the line types itself in blackletter |
| 016 | "against the black" | P12 | the press, darker, the platen descends | "against the black machine," |
| 017 | "then sends" | P13 M | the Abbot's manuscript handed to a printer with inked hands | "then sends it **to the printer.**" |
| 018 | "Mainz" (2nd) | P06 | the Abbot holding his own PRINTED book; the irony shot | **MAINZ, 1494.** · `DE LAUDE SCRIPTORUM · PRINTED` |
| 019 | "Clean" | P14 | the type case, sorts reversed | **Clean.** set in blackletter, re-sets itself letter by letter into Plex: the press arrives in the type |

## III · Mea culpa (pre-chorus + chorus 1, lamp light → the cathedral)

| # | on | plate | shot | type |
|---|---|---|---|---|
| 020 | "Be honest" (pre, whispered) | P15 | the confessional: the dev kneels, laptop glow through the lattice | "Be honest." ×2, whispered small, inside the lattice |
| 021 | riser | P15 | push into the lattice until the grille fills the frame | the grille becomes the meme's 3×2 grid |
| 022 | "Who wrote the tests?" (drop) | P16 | the cathedral of developers, wide, laptops glowing in the pews | the question, Plex 700 |
| 023 | "MEA CULPA!" | P17 M | a row strikes their chests on the beat | **MEA CULPA!** Anton, full frame, ink flash |
| 024 | "Who read the code?" | P03 | the dev alone, 2026 | question |
| 025 | "MEA CULPA!" | P17 M | another row, closer | **MEA CULPA!** |
| 026 | "Who held a candle" | P02 | the scribe, 1492, the candle | "Who held a candle to **every line?**" |
| 027 | "MEA CULPA!" | P16 | wide, the whole cathedral strikes | **MEA CULPA!** |
| 028 | "Be honest…" | P04 | the Abbot at the door | **Be honest…** blackletter |

## IV · The numbers (verse 2, cold screen night, 2026)

| # | on | plate | shot | type / device |
|---|---|---|---|---|
| 029 | "Twenty-five" | P25 | looking straight up into the hanging pages | **THE CURVE** starts: a vermilion line, point `25%` · `GOOGLE · OCT 2024` |
| 030 | "thirty" | P25 | the line climbs | `30%` · `APR 2025` |
| 031 | "a half" | P24 | match cut: the press nave becomes the server hall | `~50%` · `LATE 2025` |
| 032 | "three quarters" | P24 M | the racks, a slow push | **75%** · `APR 2026 · NEW CODE, AI-GENERATED` |
| 033 | "Go ahead and laugh" | P41 | the modern Abbot (senior engineer) peeks round a glass door | — |
| 034 | "You still read it" | P03 | the dev, finger on the printout | "You still read it **line by line**," · `LINES REVIEWED 1,204` |
| 035 | "a candle and a quill" | P02 | match cut to 1492, same finger | "a candle and a quill," |
| 036 | "green ticks" | P19 | the rosary on the keyboard; a tick drawn on each bead as it is counted | "green ticks like a rosary," |
| 037 | "count them still" | P19 | macro, the beads slide | ticks counted `1…12` |
| 038 | "Looks good to me" | P20 M | the senior engineer raises two fingers: a blessing | **LGTM.** · "Amen." |
| 039 | "Works on my machine" | P21 | the dev, hands pressed together over the laptop | "Works on my machine. **Amen.**" |
| 040 | "Ship it on a Friday" | P22 | the empty office, Friday dusk, a finger over Enter | "Ship it on a **Friday**," · `FRI 18:47` |
| 041 | "confess it all again" | P23 M | 3 a.m., red alert light on his face | "then confess it all again." · `INCIDENT #1` |

## V · Mea culpa again (pre-chorus + chorus 2, both eras at once)

| # | on | plate | shot | type |
|---|---|---|---|---|
| 042 | "Be honest" ×2 | P15 | the confessional again, the other side: through the lattice we see the press light | whispered |
| 043 | "Who wrote the tests?" | split | 1492 left, 2026 right, the same man | question across the split |
| 044 | "MEA CULPA!" | P17 M | the row strikes | **MEA CULPA!** |
| 045 | "Who approved the merge?" | P20 | the senior engineer's blessing hand | question |
| 046 | "MEA CULPA!" | P16 | wide | **MEA CULPA!** |
| 047 | "Who swore it worked" | P21 | the praying dev | "on every machine?" |
| 048 | "MEA CULPA!" | P17 M | closer, faster | **MEA CULPA!** |
| 049 | "Be honest…" | P04 | the Abbot | blackletter |

## VI · Look up (bridge, the beat stops, grey first light)

| # | on | plate | shot | type |
|---|---|---|---|---|
| 050 | "It was never" | P26 | the scriptorium window, grey light; the candle still burning below it | "It was never about the tests." small, Plex 300 |
| 051 | "It was the candle" | P01 | the candle macro, its light weaker against the dawn | "It was the candle you were holding," |
| 052 | "in a room" | P09 | the rows of monks, wide, the room as the whole world | "in a room you called **the world.**" |
| 053 | "Outside" | P29 | through the window: Mainz at dawn, smoke from print shops in every street | "Outside, the world is printing." |
| 054 | — | P30 | match: the same view, 2026, the city at dawn through office glass | the year rolls 1492 → 2026, slowly |
| 055 | "Look up." | P27 M | the scribe lifts his head to the window; first light on his face | **Look up.** |
| 056 | (hold) | P28 M | the dev does the same, 2026 | — |

## VII · Deprecated (break, white dawn)

| # | on | plate | shot | type |
|---|---|---|---|---|
| 057 | "Copied by hand" | P32 | the ledger scroll, overhead | the ritual list writes itself in blackletter |
| 058 | "DEPRECATED" | P31 M | an iron seal comes down in vermilion | **DEPRECATED** Anton, stamped; the line on the scroll is struck through in red |
| 059 | "Checked by eye" | P32 | scroll | next ritual |
| 060 | "DEPRECATED" | P31 M | stamp | struck |
| 061 | "Read every line" | P32 | scroll | next ritual |
| 062 | "DEPRECATED" | P31 M | stamp | struck; the rest of the list strikes itself on the kicks: *LGTM · works on my machine · ship on Friday* |
| 063 | "And you?" | P33 | extreme close-up of the scribe's eyes, half candle, half dawn | "And you?" small, then silence |

## VIII · I did (final chorus, the flip, sunrise)

| # | on | plate | shot | type |
|---|---|---|---|---|
| 064 | "Be honest!" (key change) | P34 M | the press at full speed in sunrise, pages flying | **Be honest!** |
| 065 | "Who wrote the tests?" | P35 M | the server hall flooding with sunrise | question · counter `COPIES ×1 → ×8,192` |
| 066 | "I DID!" | P34 M | the platen slams | **I DID!** Anton, ivory on vermilion flash |
| 067 | "Who read the code?" | P35 | racks, a fast push | question · `LINES READ 1,204 → 4.1M` |
| 068 | "I DID!" | P24 | wide hall | **I DID!** |
| 069 | "Who's still holding" | P36 M | the scribe in full morning light, still holding a lit candle | "Who's still holding **the candle?**" |
| 070 | (everything drops out) | P37 | profile, backlit, the flame between him and the sun | — |
| 071 | "I did." | P37 | hold | "I did." small, his voice, Plex 300 |
| 072 | "Thank you." | P38 M | the candle goes out; smoke rises into the sunlight | "Thank you." |

## IX · Confiteor (outro)

| # | on | plate | shot | type |
|---|---|---|---|---|
| 073 | the choir | P39 | the scriptorium door open onto morning, the empty desk | — |
| 074 | "Confiteor" | P40 | the last page of a printed book: the printer's colophon | the colophon in Plex Mono: `Printed at Mainz, 1494.` then beneath it `Written in 2026.` |
| 075 | end | — | black | **CONFITEOR (BE HONEST)** · the credits (song, images, motion, engine) in mono |

## Clips (Grok Imagine), for the prompt book

Shots marked M: 002 ✓, 003 ✓, 005 ✓ (made in the probes), 009, 010, 014, 015, 017, 023, 025, 032,
038, 041, 044, 048, 055, 056, 058, 060, 062, 064, 065, 066, 069, 072 — about 22 new clips, several
shared between shots (the stamp, the chest strikes, the press at speed). Every clip prompt is
written in the probe's form (story beat, second-by-second action and reaction, camera) and
**read by Paul before anything is spent**.
