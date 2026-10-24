# Aby's Little Lab Product Requirements Document

Aby's Little Lab is a set of 22 preschool mini-games delivered as one installable web app. This document is the product record: what the app is, what each game asks a child to do, and the rules every game follows. The implementation record is [TDD.md](./TDD.md).

| Field | Value |
| --- | --- |
| Product | Aby's Little Lab |
| Audience | Preschoolers aged 36 to 60 months, playing with a parent or caregiver nearby |
| Games | 22 mini-games, one per Hub tile |
| Platforms | Tablets and phones in landscape, and desktop browsers |
| Delivery | Private installable web app, self-hosted, installed from the browser |
| Offline | Full play after the first install |
| Data | On-device only. Profiles, stickers, progress and play time never leave the device |
| Runtime | Phaser 4, TypeScript, Vite, Web Audio, SpeechSynthesis |

## Contents

- [1. Product definition and audience](#1-product-definition-and-audience)
  - [1.1 What the product is](#11-what-the-product-is)
  - [1.2 Who it is for](#12-who-it-is-for)
  - [1.3 Product principles](#13-product-principles)
  - [1.4 Platforms, install and offline](#14-platforms-install-and-offline)
  - [1.5 Session flow](#15-session-flow)
- [2. Curriculum map](#2-curriculum-map)
  - [2.1 How the games are grouped](#21-how-the-games-are-grouped)
  - [2.2 The 22 games by domain](#22-the-22-games-by-domain)
- [3. Game specifications](#3-game-specifications)
- [4. Cross-game systems](#4-cross-game-systems)
  - [4.1 Shared scene bases and lazy loading](#41-shared-scene-bases-and-lazy-loading)
  - [4.2 One narrator, spoken rules and prompts](#42-one-narrator-spoken-rules-and-prompts)
  - [4.3 The mascot](#43-the-mascot)
  - [4.4 Stickers](#44-stickers)
  - [4.5 Profiles](#45-profiles)
  - [4.6 Play-time limits](#46-play-time-limits)
  - [4.7 Learning Progress](#47-learning-progress)
  - [4.8 Adaptive difficulty](#48-adaptive-difficulty)
  - [4.9 Preferred voice](#49-preferred-voice)
  - [4.10 Install and update](#410-install-and-update)
- [5. Interaction, touch and motion](#5-interaction-touch-and-motion)
  - [5.1 Visual language](#51-visual-language)
  - [5.2 Touch targets](#52-touch-targets)
  - [5.3 The parental lock](#53-the-parental-lock)
  - [5.4 Textless cues](#54-textless-cues)
  - [5.5 Screen, orientation and letterboxing](#55-screen-orientation-and-letterboxing)
  - [5.6 Motion and feedback](#56-motion-and-feedback)
  - [5.7 Reduced motion](#57-reduced-motion)
- [6. Audio](#6-audio)
  - [6.1 Sound effects](#61-sound-effects)
  - [6.2 Music](#62-music)
  - [6.3 Speech](#63-speech)
  - [6.4 Audio focus](#64-audio-focus)
  - [6.5 Toggles](#65-toggles)
- [7. Performance and asset budget](#7-performance-and-asset-budget)
  - [7.1 The boot asset set](#71-the-boot-asset-set)
  - [7.2 Shell and game chunks](#72-shell-and-game-chunks)
  - [7.3 Art that travels with a game](#73-art-that-travels-with-a-game)
  - [7.4 Runtime targets](#74-runtime-targets)
- [8. Release readiness](#8-release-readiness)
  - [8.1 Gates](#81-gates)
  - [8.2 Deploy path](#82-deploy-path)
  - [8.3 Definition of done](#83-definition-of-done)
- [9. See also](#9-see-also)

## 1. Product definition and audience

### 1.1 What the product is

Aby's Little Lab is 22 small games with one shared Hub. Each game teaches one skill and asks for one gesture: tap the card that matches, drag the shape into its hole, trace the line, put the story in order. A playthrough lasts between three and six rounds, ends in a celebration, and returns to the Hub on its own.

There is no score, no timer, no lives and no fail state. A wrong tap plays a soft tone, nudges the piece back, and leaves the round open so the child can try again. The reward is a sticker for finishing a game the first time, kept on a shelf under that game's tile.

Every instruction a child needs is spoken, or played as a note sequence where the notes are the lesson. Everything else on screen is a picture, a glyph, or the learning content itself. A parent reaches settings, profiles, progress and exit through a three second press that a toddler is unlikely to hold.

### 1.2 Who it is for

The child is between 36 and 60 months old. They cannot read, they may not know their letters or numerals yet, and they play in short bursts with an adult nearby. The games assume no prior knowledge: the first round of every game is the easiest one it has.

The adult is the second user. They choose a profile and an avatar, set a daily play-time limit, pick a voice, read the Learning Progress view, install the app, and reset progress. All of that sits behind the parental lock.

The device is usually a tablet in a stand or a phone held sideways. The app is designed for a fixed 1024 by 768 landscape frame, scaled to fit and letterboxed on anything else.

### 1.3 Product principles

- **No fail state.** Wrong answers cost nothing and are never counted against the child. A round stays open until it is solved.
- **No advertising, no tracking, no account.** Play does not depend on the network. Profiles, stickers, progress and play time are stored on the device.
- **One mechanic per game.** The gesture is the lesson, so a child who has learned the gesture can concentrate on the content.
- **Textless cues.** Every instruction is spoken, and the child-facing cue is a glyph, a picture or an animation. A short written line beside the speaker glyph is there for the adult, not for the child to read. Letters, numerals, words and colour names are learning content, not instructions, so they may appear as text.
- **Calm feedback.** Short chimes, a colour splash and a bounce. No flashing, no shaking, no negative sound.
- **Parent gate on everything that changes state.** Settings, profiles, Learning Progress, reset and leaving a game all require the parental hold.
- **Gentle ramp.** The first round of a game is its easiest, and adaptive games adjust between playthroughs only, never mid-round.

### 1.4 Platforms, install and offline

The app is a single web build that installs as a PWA. It runs full screen in landscape, with the manifest asking for fullscreen and falling back to standalone. Installing is offered from the Settings panel, which shows "Install App" on Chrome, Edge and Android, an iOS Safari how-to wherever the app is neither installed nor running standalone and no prompt is available, and nothing once the app is installed or running standalone. Listening for the browser's install prompt starts when the app boots, not when Settings opens, because the browser makes its offer once per page load and often long before a parent asks for the panel.

The row reports the browser's offer as of the moment the panel opens, and it is not live: a prompt that arrives while Settings is already open shows up the next time it opens. The offer is single use. Once "Install App" has been used, the next time Settings opens the row is gone, and it only returns if the browser makes a fresh offer; the row already on screen does not change. Nothing about the dismissal is stored, so a reload starts from whatever the browser offers then.

Offline play is a product requirement, not a bonus: after the first load the service worker serves the shell, the game chunks, the icons, the bundled font and the music loop from cache. A cold boot with no network is expected to behave exactly like a warm one.

The app is self-hosted on a private server behind HTTPS (Docker and Nginx on a private VPS, deployed through Coolify from CI). HTTPS is required for the service worker and for installability; localhost is enough for smoke tests.

### 1.5 Session flow

1. **Boot.** Locks the screen to landscape where the browser allows it, initialises audio and reads stored settings and profiles.
2. **Preload.** Shows the brand lockup and a progress bar while the boot asset set rasterises.
3. **Hub.** Shows the 22 game tiles, each a storybook icon above a short text label with its sticker shelf below, plus the avatar chip, the play-time indicator when a limit is set, the mascot and the hidden settings hold.
4. **Game.** The game's chunk is fetched and evaluated before the 300 ms crossfade, so a slow chunk never lands mid-round. If it cannot be fetched, the Hub tries again by itself. When that retry fails too, the rest of the Hub stays usable and a wordless retry ring appears on the tile the child tapped; tapping the ring tries the same game again. A game that never opens charges no play time and records no play.
5. **Return.** Finishing a game plays the shared celebration, awards a sticker the first time, and fades back to the Hub after three seconds with the new sticker highlighted. The Back button in a game also returns to the Hub, but only through the parental hold.

The Hub fits all 22 tiles in a 6 by 4 grid on wide screens. When the fitted scale would push a tile below the 64 px touch floor, which is the normal case on a phone, the Hub switches to pages of 5 by 2 larger tiles (ten, ten and two) with swipe between pages and textless page dots. Both layouts are fixed furniture: they do not reflow during a session.

## 2. Curriculum map

### 2.1 How the games are grouped

The 22 games are grouped by the developmental skill they are built around. The grouping is a product view, not a claim about assessment: a game practises its domain first and leans on others in passing. Numeracy games use visual discrimination, literacy games use working memory, and every drag game is fine motor practice.

The nine domains are cognitive reasoning, fine motor, inhibitory control, visual discrimination, working memory, early literacy, early numeracy, social-emotional learning and narrative sequencing.

### 2.2 The 22 games by domain

Games are numbered in Hub order, which is the order used throughout this document.

| # | Game | Domain | What the child practises | Spec |
| --- | --- | --- | --- | --- |
| 1 | Shape Sorter | Cognitive reasoning | Matching a shape to its cut-out hole by silhouette | [3.1](#31-shape-sorter) |
| 2 | Animal Trace | Fine motor | Tracing a dotted path with one finger | [3.2](#32-animal-trace) |
| 3 | Pop & Freeze | Inhibitory control | Popping bubbles while leaving the sleeping animals alone | [3.3](#33-pop--freeze) |
| 4 | Shadow Match | Visual discrimination | Matching an object to its dark silhouette | [3.4](#34-shadow-match) |
| 5 | Musical Memory | Working memory | Repeating an expanding note sequence on three frogs | [3.5](#35-musical-memory) |
| 6 | Big & Small | Cognitive reasoning | Sorting the same toy by size into the big or small box | [3.6](#36-big--small) |
| 7 | Pattern Builder | Cognitive reasoning | Choosing the shape that continues a repeating pattern | [3.7](#37-pattern-builder) |
| 8 | Find the Letter | Early literacy | Recognising a letter shape among four cards | [3.8](#38-find-the-letter) |
| 9 | Find the Word | Early literacy | Matching a printed word to a picture and spoken word | [3.9](#39-find-the-word) |
| 10 | Build the Word | Early literacy | Placing letters in order to spell a pictured word | [3.10](#310-build-the-word) |
| 11 | How Many? | Early numeracy | Matching a spoken numeral to a group of that size | [3.11](#311-how-many) |
| 12 | First Sounds | Early literacy | Picking the letter that starts a spoken word | [3.12](#312-first-sounds) |
| 13 | More or Less | Early numeracy | Comparing two groups using more and less | [3.13](#313-more-or-less) |
| 14 | Odd One Out | Cognitive reasoning | Finding the item that does not belong | [3.14](#314-odd-one-out) |
| 15 | Color Match | Visual discrimination | Matching an object's colour to a swatch | [3.15](#315-color-match) |
| 16 | Add It Up | Early numeracy | Combining two dot groups and naming the total | [3.16](#316-add-it-up) |
| 17 | Take Away | Early numeracy | Removing dots from a group and naming what is left | [3.17](#317-take-away) |
| 18 | Memory Match | Working memory | Holding card positions in mind while turning pairs | [3.18](#318-memory-match) |
| 19 | Decode It | Early literacy | Reading short words among distractors that look alike | [3.19](#319-decode-it) |
| 20 | Number Order | Early numeracy | Putting numerals in ascending order | [3.20](#320-number-order) |
| 21 | Feelings Faces | Social-emotional | Naming an emotion from a short everyday scenario | [3.21](#321-feelings-faces) |
| 22 | Story Order | Narrative sequencing | Putting three pictures in first, next, last order | [3.22](#322-story-order) |

Domain counts: cognitive reasoning 4, fine motor 1, inhibitory control 1, visual discrimination 2, working memory 2, early literacy 5, early numeracy 5, social-emotional 1, narrative sequencing 1.

## 3. Game specifications

Every game below uses the same six fields: the mechanic the child performs, the round structure and content pool, the difficulty model, how it reacts to a right and a wrong move, how it is narrated, and the art it uses. Difficulty adapts in every game through the band shift described in [4.8](#48-adaptive-difficulty); the shape that adaptation takes is each game's own.

### 3.1 Shape Sorter

- **Mechanic.** Drag each shape tile into the matching cut-out hole on the board. The shape and the hole match by silhouette, so the child compares form rather than colour.
- **Rounds and pool.** Three rounds of three shapes, nine unique shapes per playthrough, drawn from a pool of 18: circle, square, triangle, star, heart, crescent, oval, rectangle, diamond, pentagon, hexagon, octagon, trapezoid, semicircle, arrow, plus, ring and teardrop.
- **Difficulty.** Adaptive. The band selects the shape pool each playthrough draws from: the easiest band draws from nine ornamental, highly distinct shapes, the classic band from all 18, and the hardest band from ten easily confused geometric families. Three rounds of three at every shift.
- **Feedback.** A dragged shape lifts to 1.1 times its display size with a 4 degree tilt, 1.05 times and level under reduced motion, while its matching hole pulses an outline. A correct drop snaps to the slot centre over 200 ms (120 ms reduced) with the chime and a progress dot, and a wrong drop bounces back; the incorrect tone plays only on a drop onto a hole, so a shape lifted and released in place stays silent.
- **Narration.** One rule line: "Drag each shape into its hole." Spoken once at scene entry, replayable from the speaker glyph. No per-round prompt.
- **Art and assets.** 18 filled shape SVGs plus 18 matching cut-out SVGs, each shape with its own flat colour, loaded with the game from the `shapes` and `cutouts` art groups rather than the boot set. Tile and sticker icons for the Hub.

### 3.2 Animal Trace

- **Mechanic.** Trace the dotted path from an animal to its food with one finger. The traced line lights up as the finger passes each waypoint.
- **Rounds and pool.** Three of six animal and food pairs per playthrough: monkey and banana, rabbit and carrot, cat and fish, dog and bone, elephant and peanut, pig and apple. Three progress dots.
- **Difficulty.** Adaptive. Three pairs at every shift; each traced path carries four, six or eight waypoints as the band shifts.
- **Feedback.** The animal hops between waypoints in two 60 ms halves (one shorter half under reduced motion) and the food wiggles 4 degrees three times when it arrives, while each waypoint pops its progress dot from 1 to 1.4 and back. There is no wrong answer, so the mascot never nods in this game.
- **Narration.** Rule line: "Trace the line to the animal's food." No per-round prompt.
- **Art and assets.** Six animal SVGs and six food SVGs, loaded with the game from the `animals` and `food` art groups rather than the boot set. The path itself is computed at runtime from a curve, not pre-drawn art.

### 3.3 Pop & Freeze

- **Mechanic.** Pop floating bubbles by tapping them, while leaving the bubbles with a sleeping animal alone. Tapping a sleeping animal plays a wake tone and nothing else.
- **Rounds and pool.** One continuous board. Five bubbles float at once, with one or two of them sleeping animals in the classic band. Six pops complete the game, with bubbles respawning as they are popped.
- **Difficulty.** Adaptive. Six pops at every shift; the band widens or narrows how many of the five bubbles sleep: none or one at the easiest band, one or two in the classic band, two or three at the hardest.
- **Feedback.** A pop shrinks the bubble over 200 ms (120 ms reduced) and releases three teal droplets that radiate and fade. Sleeping decoys breathe on a 1.0 to 1.03 loop that stops under reduced motion, and tapping one plays the wake tone with a 1.15 times wobble (1.05 times over 180 ms reduced) and no penalty.
- **Narration.** Rule line: "Pop the bubbles, but not the sleeping animals." The sleeping-animal tone is the in-game correction.
- **Art and assets.** Bubble and sleep glyph SVGs, plus animal heads, loaded with the game from the `glyphs` and `animals` art groups rather than the boot set. Tile and sticker icons.

### 3.4 Shadow Match

- **Mechanic.** Drag each picture onto its matching dark silhouette. Objects lift, tilt slightly, and settle into the shadow.
- **Rounds and pool.** Six objects per playthrough from a pool of twelve: house, tree, car, boat, ball, umbrella, airplane, mushroom, sock, boot, kite and bell. Six matches complete the game.
- **Difficulty.** Adaptive. Six of the twelve objects at every shift; the easiest band draws one object per confusable pair so no two look alike, the classic band draws any six, and the hardest band draws three full confusable pairs.
- **Feedback.** A correct drop snaps the picture into its silhouette over 200 ms of Cubic.out (120 ms reduced), stamps the shadow with a 1.1 times pulse (smaller under reduced motion) over a brief white fill flash, and dims the matched object to 50 percent alpha with the chime and a progress dot; a wrong drop bounces back.
- **Narration.** Rule line: "Drag each picture onto its shadow." No per-round prompt.
- **Art and assets.** Twelve object SVGs and twelve shadow SVGs, loaded with the game from the `items` and `shadows` art groups rather than the boot set, the shadows drawn as flat dark silhouettes at the icon tier.

### 3.5 Musical Memory

- **Mechanic.** Listen to the frogs sing a short sequence, then tap the frogs in the same order. Three frogs, tuned to C4, E4 and G4.
- **Rounds and pool.** The sequence starts at two notes and grows by one note per completed round. Five rounds at every shift, so the last sequence is four notes longer than the first. Sequences are generated so the same frog never sings more than two notes in a row.
- **Difficulty.** Adaptive. The band ladder moves the starting length one note in either direction (one, two or three notes), and the five round shape is the same at every shift.
- **Feedback.** Every frog tap bounces the frog (1.2 times over 200 ms, 1.05 times over 120 ms reduced) and emits an expanding ripple ring, lily pads drift 3 px up and down on a 3 s loop that stops under reduced motion, and a completed sequence pops its progress dot. A wrong tap plays the soft tone, nods the mascot and replays the sequence from its first note.
- **Narration.** The notes are the prompt, so there is no spoken rule or target. A speaker glyph replays the sequence at any time and is the only narration control.
- **Art and assets.** Three frog colours and a lily pad, loaded with the game from the `music` art group rather than the boot set, with a ripple ring drawn at runtime around each frog as it sings.

### 3.6 Big & Small

- **Mechanic.** Drag each toy into the big box or the small box according to its size. The same toy appears at both sizes.
- **Rounds and pool.** Three of six toy types per playthrough (teddy bear, car, ball, block, rocket, drum), each shown big and small, so six toys to sort. Six placements complete the game.
- **Difficulty.** Adaptive. The band sets how wide the size gap between the boxes is: big toys render at 1.6 times base scale and small toys at 0.68 at the easiest band, 1.5 and 0.7 in the classic band, and 1.35 and 0.8 at the hardest, which keeps the pair tellable apart at a glance at every shift.
- **Feedback.** Toys drag with the shared lift and drop-zone highlight of Shape Sorter, and a correct drop shrinks the toy into the box over 150 ms while the lid wiggles 3 degrees three times and the box bumps to 1.05 times scale with the splash; a wrong drop bounces back with the soft tone and no penalty.
- **Narration.** Rule line: "Put the big toys in the big box." No per-round prompt.
- **Art and assets.** Seven toy SVGs including the box, loaded with the game from the `toys` art group rather than the boot set. Tile and sticker icons.

### 3.7 Pattern Builder

- **Mechanic.** Tap the shape that finishes the pattern. The pattern strip has four slots, three filled and one gap.
- **Rounds and pool.** Six rounds. Each round has four slots with three filled and one gap, and three answer choices drawn from the 18 shapes. The first slot is never the gap.
- **Difficulty.** Adaptive. The band ladder shifts the pattern type and the gap: the easiest band always hides the last slot on an ABAB row, the middle band widens to ABAB, AABB or ABB with the last slot still hidden, and the top band may hide a middle slot instead.
- **Feedback.** A correct tap flashes the card in the success green, chimes, cheers the mascot and pops the progress dot before the next round opens 700 ms later; a wrong tap plays the soft tone and wiggles the card 4 degrees three times (2 degrees over 200 ms under reduced motion) with a mascot nod and no penalty.
- **Narration.** Rule line: "Pick the shape that finishes the pattern." No per-round prompt.
- **Art and assets.** Reuses the Shape Sorter shape SVGs, loaded with the game from the `shapes` art group. Tile and sticker icons.

### 3.8 Find the Letter

- **Mechanic.** Tap the card showing the target letter. The target is shown large and spoken.
- **Rounds and pool.** Six rounds, six unique letters per playthrough from the 26 letter set, four cards per round.
- **Difficulty.** Adaptive. The band ladder shifts the letter range: a child who is still learning sees a narrow early-alphabet set, a child who is accurate sees the wider pool.
- **Feedback.** The target letter pops in at 256 px and is re-named from the speaker glyph on demand. A correct tap flashes the card green, chimes and pops the progress dot before the next round opens 700 ms later; a wrong tap wiggles the card 4 degrees three times (2 degrees over 200 ms reduced) with a mascot nod and no penalty.
- **Narration.** Per-round target: the letter is spoken as it appears. The speaker glyph repeats it.
- **Art and assets.** 26 letter SVGs, loaded with the game from the `letters` art group rather than the boot set. Letters are drawn as shapes in the app's display style so recognition is about form, not decoration. The target renders at 256 px and the answer cards at 128 px from the same `letter_*` textures, so the letterforms match the word games. Tile and sticker icons.

### 3.9 Find the Word

- **Mechanic.** Tap the printed word that matches the picture and the spoken word.
- **Rounds and pool.** Six rounds. An 18 word pool, eight three-letter words and ten four-letter words. Four word cards per round, never two starting with the same letter.
- **Difficulty.** Adaptive. The band ladder shifts the mix of three and four letter words. A child who is finding it hard sees only three-letter words.
- **Feedback.** The prompt picture pops in and every card squishes on press. A correct tap flashes the card green with the chime and a progress dot; a wrong tap wiggles the card 4 degrees three times (2 degrees over 200 ms reduced) with a mascot nod and no penalty.
- **Narration.** Per-round target: the word is spoken at a slow rate while the picture shows its meaning.
- **Art and assets.** 18 prompt pictures. Most reuse the art other games already draw; four SVGs (sun, hat, bug, duck) were added for this game. All of it is loaded with the game from the `animals`, `food`, `items`, `letters`, `music`, `shapes` and `toys` art groups rather than the boot set. Tile and sticker icons.

### 3.10 Build the Word

- **Mechanic.** Build the pictured word by tapping letter tiles into empty slots, in order. Placed letters can be tapped to take them back.
- **Rounds and pool.** Three words per playthrough, easy first: two three-letter words then one four-letter word.
- **Difficulty.** Adaptive. The band ladder shifts the word tiers; the easy-first order is fixed.
- **Feedback.** A correct letter tile settles into the next empty slot with a Back.out pop and a soft tick, and a wrong tile wiggles with the soft tone and no penalty. A finished word lingers 1.2 s on a chime and a Hoot cheer before the next word appears.
- **Narration.** Per-round target: the word is spoken when the round opens, and the replay glyph repeats it.
- **Art and assets.** Letter SVGs for the tiles and the prompt picture, loaded with the game from the `animals`, `food`, `items`, `letters`, `music`, `shapes` and `toys` art groups rather than the boot set. Extra tiles are two or three distractors drawn from the alphabet minus the word's own letters, shuffled in with the word's letters. Tile and sticker icons.

### 3.11 How Many?

- **Mechanic.** Tap the group that has the target number of items. The numeral is shown large and spoken.
- **Rounds and pool.** Six rounds, two per band: 1 to 3, 1 to 5, 1 to 10. Three or four group cards per round, built from eight counting objects.
- **Difficulty.** Adaptive. The band ladder shifts the number range.
- **Feedback.** The numeral pops in large and is re-heard from the speaker glyph on demand. A correct tap flashes the group card green with the chime and a progress dot; a wrong tap wiggles it 4 degrees three times (2 degrees over 200 ms reduced) with a mascot nod and no penalty.
- **Narration.** Per-round target: the numeral is spoken as it appears.
- **Art and assets.** Numeral SVGs and eight counting-object textures, loaded with the game from the `numerals`, `items`, `food` and `shapes` art groups rather than the boot set. Tile and sticker icons.

### 3.12 First Sounds

- **Mechanic.** Tap the letter that starts the spoken word for the picture shown.
- **Rounds and pool.** Six rounds from a 12 word pool with nine distinct initial letters. The pool avoids the confusable pairs (b and p, d and t) and visually similar letter families.
- **Difficulty.** Adaptive. The band ladder shifts which words and distractors appear.
- **Feedback.** A correct tap flashes the letter card green, chimes, pops the progress dot and speaks the letter back; a wrong tap wiggles it 4 degrees three times (2 degrees over 200 ms reduced) with a mascot nod and no penalty.
- **Narration.** Per-round target: the word is spoken, and the picture shows it.
- **Art and assets.** Four letter cards from the 26 letter SVGs, plus prompt pictures, loaded with the game from the `animals`, `food`, `items`, `letters`, `music`, `shapes` and `toys` art groups rather than the boot set. Tile and sticker icons.

### 3.13 More or Less

- **Mechanic.** Tap the group with more items, or the group with fewer, following a large arrow cue.
- **Rounds and pool.** Six rounds, three asking for more and three for fewer. Two group cards per round, with bands of 1 to 3, 1 to 5 and 1 to 10.
- **Difficulty.** Adaptive. The band ladder shifts the number range.
- **Feedback.** The arrow cue pops in large and stays beside the two groups. A correct tap flashes the card green with the chime and a dot pop; a wrong tap wiggles it with a gentle mascot nod and no penalty.
- **Narration.** Per-round target: the comparison word ("more" or "less") is spoken, and the arrow repeats it visually.
- **Art and assets.** Up and down arrow SVGs, group cards built from the counting-object textures, loaded with the game from the `glyphs`, `items`, `food` and `shapes` art groups rather than the boot set. Tile and sticker icons.

### 3.14 Odd One Out

- **Mechanic.** Tap the card that does not belong in a 2 by 2 grid of four cards.
- **Rounds and pool.** Six rounds across three kinds of difference: different category, same category but a different item, and near-identical items such as three frog colours. The pool is 33 textures: six animals, three frogs, six toys and 18 shapes.
- **Difficulty.** Adaptive. The band ladder shifts the mix of difference kinds across the six rounds.
- **Feedback.** A correct tap flashes the card green with the chime and a dot pop, and a wrong tap wiggles it with a gentle mascot nod and no penalty. The odd item's name is re-heard from the speaker glyph at any point in the round.
- **Narration.** Per-round target: the odd item is named when the round opens.
- **Art and assets.** Reuses animal, toy and shape SVGs, loaded with the game from the `animals`, `music`, `shapes` and `toys` art groups rather than the boot set. Tile and sticker icons.

### 3.15 Color Match

- **Mechanic.** Tap the object whose colour matches the swatch shown at the top of the screen.
- **Rounds and pool.** Six rounds. The first rounds use a four colour pool (red, blue, yellow, green); later rounds add orange and purple. Four cards per round, each a different colour.
- **Difficulty.** Adaptive. The band ladder shifts how early the larger colour pool appears.
- **Feedback.** The swatch stays on screen all round so the colour can be compared again. A correct tap flashes the card green with the chime and a dot pop; a wrong tap wiggles it with a gentle mascot nod and no penalty.
- **Narration.** Per-round target: the colour name is spoken.
- **Art and assets.** The swatch is drawn at runtime rather than shipped as art. Objects reuse existing SVGs, one per colour: red heart, blue frog, yellow crescent, green rectangle, orange circle, purple square, loaded with the game from the `music` and `shapes` art groups rather than the boot set. Tile and sticker icons.

### 3.16 Add It Up

- **Mechanic.** Count the dots on two group cards joined by a plus sign, then tap the answer card whose group matches the total.
- **Rounds and pool.** Six rounds. Bands are sums up to 4, up to 6 and up to 10. Four answer cards per round, each a distinct total, and no repeated addend pair within a playthrough.
- **Difficulty.** Adaptive. The band ladder shifts the maximum sum. All round mechanics come from the shared group-math base; this game pins only the rule set.
- **Feedback.** The plus and equals cues pop in with the round. A correct tap flashes the answer card green with the chime and a dot pop; a wrong tap wiggles it with a gentle mascot nod and no penalty.
- **Narration.** Rule line: "Add the groups and pick the total." No per-round question voice; the equation is the prompt.
- **Art and assets.** Plus and equals SVGs, dot-group cards built from the counting-object textures, loaded with the game from the `glyphs`, `items`, `food` and `shapes` art groups rather than the boot set. Tile and sticker icons.

### 3.17 Take Away

- **Mechanic.** Count the dots on the first group, take away the dots in the second group joined by a minus sign, then tap the answer card for what is left.
- **Rounds and pool.** Six rounds. Bands are totals up to 4, up to 6 and up to 10. The starting group is always larger than the group removed, so the answer is never zero and never negative.
- **Difficulty.** Adaptive. The band ladder shifts the maximum total, same as Add It Up.
- **Feedback.** The minus and equals cues pop in with the round. A correct tap flashes the answer card green with the chime and a dot pop; a wrong tap wiggles it with a gentle mascot nod and no penalty.
- **Narration.** Rule line: "Take some away and pick how many are left." No per-round question voice.
- **Art and assets.** Minus and equals SVGs, dot-group cards from the counting-object textures, loaded with the game from the `glyphs`, `items`, `food` and `shapes` art groups rather than the boot set. Tile and sticker icons.

### 3.18 Memory Match

- **Mechanic.** Turn over two cards at a time to find a pair, holding the positions in mind between turns.
- **Rounds and pool.** Six rounds. The grid grows across the ladder: three pairs in a 2 by 3 grid, six pairs in a 3 by 4 grid, eight pairs in a 4 by 4 grid. Pairs are drawn from a 16 texture pool of six animals, six toys and four small items.
- **Difficulty.** Adaptive. The band ladder shifts the grid size.
- **Feedback.** Cards deal in face down on a 40 ms per card stagger and turn with a scaleX 1 to 0 to 1 flip (180 ms a half, 120 ms reduced). A matched pair flashes green with the chime and a Hoot cheer; a mismatch wiggles both cards 4 degrees three times and turns them back after an 800 ms pause, with no penalty.
- **Narration.** Rule line: "Turn over two cards to find a pair." No per-round prompt.
- **Art and assets.** 16 pair textures and a card back, loaded with the game from the `animals`, `toys`, `items` and `glyphs` art groups rather than the boot set. Tile and sticker icons.

### 3.19 Decode It

- **Mechanic.** See the picture and hear the word, then tap the printed word that names it among four cards.
- **Rounds and pool.** Six rounds, easy first. Rounds one to three use three-letter words and rounds four to six use four-letter words, drawn from a 22 word pool. Four word cards per round, guarded against distractors that share the target's first letter or a confusable letter shape.
- **Difficulty.** Adaptive. The band ladder shifts the split between three and four letter words, so a stronger reader meets four-letter words a round or two earlier.
- **Feedback.** The target word is re-heard from the speaker glyph. A correct tap flashes the card green with the chime and a dot pop before the next word 700 ms later; a wrong tap wiggles it 4 degrees three times (2 degrees over 200 ms reduced) with a mascot nod and no penalty.
- **Narration.** Per-round target: the target word is spoken while the picture shows its meaning, and the speaker glyph repeats it.
- **Art and assets.** The pool shares 18 words with Find the Word and adds four (fox, cup, map, bed). Four new item SVGs. All of it is loaded with the game from the `animals`, `food`, `items`, `letters`, `music`, `shapes` and `toys` art groups rather than the boot set. Tile and sticker icons.

### 3.20 Number Order

- **Mechanic.** Drag shuffled numeral cards into dashed slots to put them in ascending order. The board checks itself when the last slot fills. Tapping a numeral speaks it.
- **Rounds and pool.** Six rounds across three bands: three numerals from 1 to 5, four numerals from 1 to 8, five numerals from 1 to 10.
- **Difficulty.** Adaptive. The band ladder shifts both the count and the range.
- **Feedback.** A card dropped into a slot snaps into place with the shared lift and snap juice. A correct board bursts the shared splash, chimes and fills the progress dot; a wrong board wiggles every placed card and then bounces them home, so the child rebuilds the order.
- **Narration.** Rule line: "Put the numbers in order, smallest first." Numerals are spoken on tap rather than as a round prompt.
- **Art and assets.** Numeral SVGs, loaded with the game from the `numerals` art group rather than the boot set, with dashed slot outlines drawn at runtime. Tile and sticker icons.

### 3.21 Feelings Faces

- **Mechanic.** Hear a short scenario about Aby, then tap the face that shows how Aby feels. Three face cards per round, drawn from four faces: happy, sad, angry and scared.
- **Rounds and pool.** Six rounds from a pool of 24 scenarios, six per emotion. Each playthrough uses one scenario per emotion plus two more, with no repeats. Every round includes the target emotion among three distinct faces.
- **Difficulty.** Adaptive. The band sets the contrast ramp: the easiest band plays all six rounds with clearly distinct emotions (happy against angry), the classic band plays three distinct rounds then three confusable ones (sad against scared), and the hardest band plays all six with the confusable pair.
- **Feedback.** Three face cards rise in under the spoken scenario and squish on press. A correct tap splashes colour at the card, fills its progress dot on a Back.out pop and cheers Hoot before the 700 ms advance; a wrong tap wiggles the card and its face 4 degrees three times (2 degrees over 200 ms reduced), nods the mascot and re-speaks the scenario, with no penalty.
- **Narration.** Rule line: "Tap the face that shows how Aby feels." Each round then speaks its scenario. A wrong tap re-speaks the scenario once and leaves the round open. When there is no voice or sound is off, the scenario appears as a caption and the glyph dims.
- **Art and assets.** Four face SVGs, loaded with the game from the `faces` art group rather than the boot set. The tile and sticker icons are in the boot set, as they are for every game. No new audio.

### 3.22 Story Order

- **Mechanic.** Drag three shuffled panels into three slots, marked by one, two and three pips, to tell the story first, next, last. Panels can be swapped between slots, withdrawn by tapping, and dropped back into the tray.
- **Rounds and pool.** Six rounds from a pool of eleven three-panel stories, five obvious (seed to flower, flat balloon to aloft, egg to duckling, ice cream to puddle, whole cake to candles to slices) and six subtle (whole banana to peel, full cup to empty, bare foot to shoe, cloud to puddle, wet clothes hung out to dry, sunrise to sunset). No repeats within a playthrough.
- **Difficulty.** Adaptive. The band sets the mix of obvious and subtle stories: five obvious and one subtle at the easiest band, three of each in the classic band, one obvious and five subtle at the hardest.
- **Feedback.** Panels squash on press and tilt as they lift, and a panel dropped on an occupied slot swaps with the one already there, so nothing is ever rejected. A correct order splashes colour at the strip's centre, chimes and fills the dot; a wrong order wiggles every placed panel, leaves them where the child put them and re-judges only when the completed order changes.
- **Narration.** Rule line: "Put the story in order, first to last." No per-round narration; the panels are the prompt.
- **Art and assets.** 33 panel SVGs. They travel with the Story Order chunk rather than the boot set, so the shell does not pay for them. Tile and sticker icons.

## 4. Cross-game systems

### 4.1 Shared scene bases and lazy loading

Every game scene extends one shared base. `GameSceneBase` owns the parts no game should reimplement: the parental lock on the Back button, the corner mascot, the speaker glyph and its narrator, progress dots, audio access, the instruction line, the win celebration, sticker award and return to the Hub, and shutdown cleanup.

`ChoiceRoundScene` sits on top of it and owns the prompt-plus-cards loop: rendering a round, tearing it down, allowing exactly one advance per tap, the 250 ms success flash, filling a progress dot, the reduced-motion wiggle, and the wrong-answer path. Fourteen of the 22 games are built on it: twelve extend `ChoiceRoundScene` directly (Find the Letter, Find the Word, How Many?, First Sounds, More or Less, Odd One Out, Color Match, Decode It, Number Order, Pattern Builder, Feelings Faces, Story Order) and two extend it through `GroupMathScene` (Add It Up, Take Away).

`GroupMathScene` adds the two-card equation row and the operation cue. Add It Up and Take Away are roughly 25 line subclasses that pin only the instruction, the game id, the cue and the round builders.

Each game is a separately built chunk, registered in a lazy scene registry and fetched before the crossfade into the game. The Hub and the shell never contain a game's code, which keeps the entry chunk under its budget and lets a returning player skip chunks they have already cached.

Game identity is declared once. A single registry lists each game's id, scene key, title, tile key and sticker key; the Hub tiles, the Learning Progress rows, the paging counts and the boot shell's 44 per-game assets - 22 tile icons and 22 sticker icons - all derive from it, so adding a game is one entry plus its scene, its art and its scene-loader row, with the id list checked by the type checker and the invariant suite rather than several lists kept in step by hand.

### 4.2 One narrator, spoken rules and prompts

Narration has one construction site. `RoundNarrator` builds the speaker glyph, the spoken line, the visible label where a rule is shown, the replay handler, the mute state and the caption fallback. Nothing else in the app constructs a speaker button in production.

Narration comes in three shapes:

- **A spoken rule line**, once at scene entry, replayable. Twelve games use one: Shape Sorter, Animal Trace, Pop & Freeze, Shadow Match, Big & Small, Pattern Builder, Memory Match, Number Order, Add It Up, Take Away, Feelings Faces and Story Order.
- **A spoken round target**, re-spoken each round. Nine games use one: Find the Letter, Find the Word, Build the Word, How Many?, First Sounds, More or Less, Odd One Out, Color Match and Decode It.
- **A replay glyph with no speech of its own**, in Musical Memory, where the note sequence is the prompt.

Speech is off when sound is off or when the device has no voice. In that state the glyph dims, captions take over where a game has them, and gameplay continues silently rather than blocking.

### 4.3 The mascot

Professor Hoot is a teacher owl drawn in two static poses, idle and celebrating. He appears in the Hub and in the corner of every game scene, where he reacts to correct answers and to the win. He is tweened only, never a second animation system, he has no voice of his own, and he is destroyed with the scene. With reduced motion on, his reactions shorten rather than disappear.

### 4.4 Stickers

Each game has exactly one sticker, awarded the first time that game is completed by the active profile. The sticker appears on a shelf under the game's Hub tile: a small thumbnail on a cream plaque, full colour and shimmering on an 800 ms alpha loop when earned, a dashed outline when not. A sticker earned in the session just played bounces and sparkles before settling. Stickers are per profile, persist across sessions, and are cleared only by the parental reset, which clears the active profile's stickers and leaves settings and other profiles untouched.

### 4.5 Profiles

The app supports up to four profiles on one device, each with one of six avatars (cat, dog, pig, frog, duck, bear) and a default of the cat. The active profile is shown as a chip on the Hub; tapping it switches profile without a PIN, because switching profile is not a destructive action. Creating or deleting a profile requires the parental hold. Stickers, progress, activity and play time are stored per profile. A device with no stored data starts with one default profile.

### 4.6 Play-time limits

A parent can set a daily limit per profile: off, 15, 30, 45 or 60 minutes. Only visible minutes count: hiding the page only pauses the clock, and it resumes when the page is visible again. A session is banked on the three exits that reach the parent - on the return to the Hub, on a page close or a navigation away (the page-exit event), and when a new game starts - so play in a tab that is never returned from still counts. Partly played minutes round up, so any game started charges at least a minute, and a session that crosses local midnight charges the new day only the part played after midnight. The budget resets on the local calendar date. The one gap is a process killed without a page-exit event and a page that left into the browser's back/forward cache and was never restored: both bank nothing for the stretch in flight, even if the page was hidden first.

The limit is shown, never enforced mid-game. The Hub shows a textless remaining-time arc, which turns warm at five minutes or less, and an hourglass nudge appears at five minutes. At the cap, game tiles dim and show a moon badge, the mascot waves once, and starting a new game is refused; a game already in progress is always allowed to finish. The Hub re-reads the budget whenever the page becomes visible again, so a Hub left open across midnight or across a limit change shows the current state without a reload. Limits are off by default.

### 4.7 Learning Progress

Learning Progress is a parent-facing overlay behind the parental hold, showing one profile at a time with avatar chips to switch between them. For each game it shows the number of plays, an accuracy bar with a percentage, a mastery star once the game has been won three times, and when it was last played in relative terms. Games are listed six rows to a page, with chevrons and a page label, and a seven-day activity strip sits at the bottom.

Progress is recorded on device as an additive part of the profile: a play when a game opens from its Hub tile, a tap for every answer, and a win when a game completes. Existing profiles backfill these fields on read, so upgrading never loses stickers or settings.

### 4.8 Adaptive difficulty

All 22 games adapt. When a game's difficulty moves, it moves for the whole playthrough, never mid-round. The shift applied to the band ladder is TDD's ([TDD §7.3](./TDD.md#73-adaptive-banding)); it is invisible to the child, who only feels a game getting easier or harder over days. A parent can turn the whole system off in Settings (on by default), which returns every game to its classic band.

An adaptive game keeps a rolling window of the profile's last ten taps for that game. Every tap feeds the window, whether the session is completed or abandoned - a child who backs out mid-game still made those taps, so they still inform the next shift. Only the window moves: the accuracy and the win count a parent sees describe completed sessions, while the play count still counts every game the child starts, abandoned or not. A shift is computed only once the window holds at least six taps: accuracy at or above 90 percent moves the band ladder up one step, accuracy below 60 percent moves it down one, and anything between leaves it alone. Most games clamp the shifted band to the 1 to 3 range the ladder defines, but some games deliberately step outside the classic ladder's shape, as described below.

The result is applied as a shift to the game's classic easy-first ladder at the start of a playthrough: once per profile, never mid-round, so difficulty can move by one band between visits but never inside a round. The ladder's values and its clamp are the TDD's to state ([TDD §7.3](./TDD.md#73-adaptive-banding)). It is invisible to the child: no badge, no message, no sound. Adaptive difficulty can be turned off in Settings, and it is on by default.

The first fifteen adaptive games are Find the Letter, Find the Word, Build the Word, How Many?, First Sounds, More or Less, Odd One Out, Color Match, Add It Up, Take Away, Memory Match, Decode It, Number Order, Pattern Builder and Musical Memory. They live in 14 scene files because Add It Up and Take Away share the group-math scene. The same shift reaches those fifteen games in six different ways:

- **A shifted band ladder** - How Many?, More or Less, Add It Up, Take Away, Number Order, Memory Match and Pattern Builder - moves every round of the classic ladder one band up or down, clamped to bands 1 to 3.
- **One shifted band for the whole playthrough** - Find the Letter and First Sounds - widens or narrows the letter range, or the word pool and its distractors, rather than splitting the rounds.
- **A tier split** - Find the Word and Build the Word - moves the boundary between the easy and the hard tier, so a stronger reader meets four-letter words earlier.
- **Its own tier split** - Decode It uses a different formula from the word games, because its classic ladder opens with three easy rounds rather than five.
- **A colour-pool split** - Color Match divides its six rounds between an easy four-colour pool and a hard six-colour pool: three and three by default, four and two when the band drops, two and four when it rises.
- **Its own ladder** - Odd One Out replaces the classic ladder outright: when the band drops every round is played at the easiest band, and when it rises band 3 is capped at three rounds with the freed round re-served at the easiest band. Musical Memory maps the shift onto its starting sequence length instead, so the game begins with one, two or three notes.

The seven games that joined them - Shape Sorter, Animal Trace, Pop & Freeze, Shadow Match, Big & Small, Feelings Faces and Story Order - do not use the band ladder; each owns a single difficulty dimension the shift selects. Shape Sorter's band chooses the playthrough's shape pool: nine ornamental, highly distinct shapes below classic, all 18 at classic, ten confusable geometric families above. Animal Trace's band chooses how many waypoints each traced path carries: four, six or eight. Pop & Freeze's band chooses how many of the five bubbles sleep: none to one, one to two, or two to three. Shadow Match's band chooses which of its twelve objects a playthrough draws: one per confusable pair below classic, any six at classic, three full confusable pairs above. Big & Small's band widens or narrows the size contrast between the boxes around the classic 1.5 and 0.7 scales. Feelings Faces' band turns its built-in contrast ramp fully distinct, keeps the classic three-and-three, or makes every round confusable. Story Order's band sets the mix of obvious and subtle stories: five and one, three and three, or one and five.

### 4.9 Preferred voice

Settings offers a Voice row listing the device voices plus "Default (device)". The choice is stored as a voice URI and applies to every spoken line in the app: rule lines, round targets, prompts and the preview button. A Preview button speaks a sample phrase so the parent can hear the voice before committing, and the preview obeys the sound toggle. If the stored voice disappears from the device, the app falls back to the device default rather than going silent.

### 4.10 Install and update

The Settings panel carries a context-aware install row: "Install App" where the browser supports prompting, an iOS Safari how-to wherever the app is neither installed nor running standalone and no prompt is available (Share, then Add to Home Screen), and nothing once the app is installed or running standalone.

Capture runs from boot for the life of the page, so a prompt the browser offered before the panel was ever opened is still there when it opens. The row is a snapshot of that offer taken when the panel opens: it does not update while the panel is open, so a prompt arriving then is picked up by the next opening. Using the prompt spends it - the next time Settings opens the row is gone, it only returns if the browser makes a fresh offer, the row already on screen does not change, and a refusal ends the same way. Nothing is remembered across reloads.

Updates are prompt-based. A new service worker is downloaded but not activated until the parent accepts. The Hub shows a small toast with "Update now" and "Later"; accepting activates the new version and reloads, declining leaves the current version running. A second toast confirms when the app is ready to play offline.

## 5. Interaction, touch and motion

### 5.1 Visual language

The palette is warm paper with a dark outline. Every surface is flat; there are no gradients on gameplay art.

| Token | Value | Use |
| --- | --- | --- |
| `--bg-base` | `#FAF9F6` | Screen background and fade colour |
| `--bg-hub` | `#FFF8E7` | Hub background |
| `--primary` | `#2B6CB0` | Primary UI and theme colour |
| `--outline` | `#2D3748` | Outlines, text and silhouettes |
| `--success` | `#68D391` | Correct feedback, progress rings |
| `--error` | `#FC8181` | Soft error tone surfaces |

| Sprite colour | Value |
| --- | --- |
| Orange | `#F6AD55` |
| Teal | `#4FD1C5` |
| Purple | `#9F7AEA` |
| Pink | `#F687B3` |
| Green | `#48BB78` |
| Blue | `#3182CE` |
| Red | `#E53E3E` |
| Coral | `#FC8181` |
| Golden brown | `#D69E2E` |
| Yellow | `#ECC94B` |

Design rules: thick dark strokes drawn at the 512 base size, flat fills, no gradients, no neon and no pure primaries. Type is the bundled Baloo 2 face, which is precached with the shell so it renders offline on the first frame.

### 5.2 Touch targets

The minimum interactive target is 64 by 64 px, the ideal is 96 by 96 px, and small art may sit inside a larger invisible hit area. Targets are inflated rather than drawn larger, so a 40 px glyph can still have a 96 px hit box.

Protected controls, meaning the ones that change state rather than play, always use the larger target: every Back button, the Hub settings hold, the replay controls, and the parental-lock row. Taps navigate on release, not on press, so a child who touches and slides away does not trigger anything.

### 5.3 The parental lock

Anything parent-facing requires a continuous three second press on a 96 by 96 px target. A circular ring fills from 0.6 alpha success green while the press is held, starting at twelve o'clock. Only one hold can run at a time, and it cancels immediately on release, pointer-out or pointer-cancel, clearing the ring and leaving no partial state.

The lock gates the Settings panel, the Back button inside a game, profile creation and deletion, Learning Progress, and Reset Progress. It is deliberately boring to a child and quick for an adult.

### 5.4 Textless cues

A child who cannot read must be able to play from pictures and speech alone. Every instruction is spoken first, and its on-screen form is a single short line beside the speaker glyph, sized for an adult to read at a glance rather than for a child to decode. Rounds also cue themselves with a glyph, an arrow, a picture or an animation, so the task makes sense with the line ignored.

The exception is learning content. Letters, numerals, printed words and colour names are what the games teach, so they appear as text and are also spoken.

### 5.5 Screen, orientation and letterboxing

The game renders into a fixed 1024 by 768 landscape frame with `Phaser.Scale.FIT` and centred letterboxing. On a wider or narrower viewport the frame scales uniformly and the extra space is background colour, never a stretched scene and never a cropped one.

The app asks the platform to lock orientation to landscape on boot and the manifest declares landscape. Where the lock is refused, which is normal on iOS, the layout still fits and the app relies on the device being held sideways. Pinch zoom is disabled outside the Settings panel and allowed inside it, so a parent can enlarge small text without the child zooming mid-round.

### 5.6 Motion and feedback

Scene changes are a 300 ms fade to the background colour into a 180 ms fade-in with a 1.02 zoom. The win celebration is ten rays and ten confetti pieces in the sprite palette, about 700 ms long, with the sticker reveal roughly 400 ms later. Correct answers flash and chime; wrong answers wiggle the piece and play a soft tone, with no shake and no red flash on the child's work.

Buttons and cards squish to 95 percent on press and settle with a short overshoot. Hub tiles enter staggered rather than all at once, 40 ms apart over 300 ms, while idle tiles breathe on a 2.5 second loop (a 2.5% scale pulse, not a vertical bob) with four low-contrast dots drifting behind the grid. An idle Hub wiggles two tiles and plays a quiet two-note call after 25 seconds of no input, repeating every ten seconds while it stays idle. Dragged pieces lift and tilt, and drop zones highlight while a piece is over them.

### 5.7 Reduced motion

The app reads the operating system's reduced-motion preference and never overrides it. When it is set, durations shorten (fades drop from 300 to 180 ms, celebrations from 700 to 300 ms), amplitudes shrink, the celebration uses six rays and no confetti, idle wiggles become a two degree sway, Hub entrances fade without scale, press feedback is disabled, and the celebrate pose holds still. Nothing that carries information is motion-only, so no game becomes unplayable with motion reduced.

## 6. Audio

### 6.1 Sound effects

All sound effects are synthesized with the Web Audio API at runtime. No audio file is shipped for an effect.

| Event | Sound |
| --- | --- |
| Tap or soft interaction | Short soft pop |
| Correct answer | The game's own ascending chime, from its own correct contour |
| Wrong answer | The game's own gentle falling tone, from its own incorrect contour |
| Bubble popped | Short 800 Hz pop |
| Sleeping animal tapped | Gentle two-note wake, E4 then A4 |
| Game complete | The game's own rising win, from its own win contour |
| Sticker awarded | Two bright notes, C6 and E6 |
| Idle Hub call | Two quiet notes, E5 and G5, at low gain |

Every game carries its own audio identity, so the same event is a different set of notes from one game to the next. An identity sets a pitch offset of up to five semitones, a waveform, a tempo between 0.75 and 1.5, and its own three contours: correct, incorrect and win. The twenty-two identities are built from four three-note correct contours, four two-note incorrect contours and four four-note win contours, so a child hears a consistent voice within a game and a different one between games.

Two rules keep the trio gentle. The incorrect contour is forced gently descending for every identity, so no game can sound harsh. The win contour is always held inside a 300 to 800 millisecond celebration, and a game whose own tempo would run long has its tempo clamped to fit that budget. The pop, the wake tone, the sticker sparkle and the idle call are shared across the app and do not take a game identity. The TDD states the effect table ([§8.2](./TDD.md#82-sound-effects)) and the identity model ([§8.7](./TDD.md#87-the-per-game-audio-identity)).

Feedback is layered but never loud: a correct tap is a chime plus a colour splash, and no game uses particle emitters.

### 6.2 Music

There is one music loop, a single ambient track shipped as `bgm.mp3` and precached with the shell. It plays at low volume, starts only after the first interaction (browsers refuse audio before that), and is independent of the effect toggle. The music element is not duplicated per scene; one manager owns it for the life of the app.

### 6.3 Speech

Spoken lines use the platform's speech synthesis with the parent's chosen voice, falling back to the device default. Words are spoken below the default rate so a preschooler can follow them; short targets such as numerals are spoken slightly faster. Speech respects the sound toggle: with sound off, nothing is spoken, captions take over where a game offers them, and the replay glyph dims.

### 6.4 Audio focus

Narration outranks music. A spoken line ducks the music, and full volume returns when the speech ends, when speech errors, when either audio toggle is turned off, or when the watchdog expires, so a browser that never fires the speech end event cannot leave the music stuck quiet. The duck level, the ramp and the watchdog interval are the TDD's ([TDD §8.3](./TDD.md#83-background-music-ducking-and-the-watchdog)). The ducked level is never written to storage: it is runtime state, and a reload always starts at full music volume.

When the document becomes hidden the app pauses the music, cancels in-flight speech, releases any duck, and stops the play-time clock. Returning to the document restores only what was actually playing and enabled before.

### 6.5 Toggles

Music and sound effects are two independent toggles in the Settings panel, each persisted per device. Turning effects off silences chimes, pops, spoken lines and the preview button while leaving music alone; turning music off leaves effects alone. Turning effects back on plays the correct-answer chime as confirmation. Both are read at startup, so a muted device boots muted.

## 7. Performance and asset budget

### 7.1 The boot asset set

The boot set is 53 keys, rasterised during Preload so that the shell never stalls on a first draw. It is deliberately small and deliberately shared: the 22 tile icons and 22 sticker icons the Hub needs, the two mascot poses, the shared speaker glyph, and the six profile avatars. Everything else a game draws is loaded with that game instead (see 7.3), so the shell does not pay for art a child may never open.

Rasterising every key at 512 by 512 would waste GPU memory, because most art displays far smaller than that. Each key is therefore rasterised at one of three tiers, chosen by an ordered rule list where the first match wins:

- **160 px (icon)** — any `tile_*` key, any `sm_shadow_*` key, and the five exact keys `minus`, `plus`, `equals`, `sleep_zzz` and `icon_speaker`.
- **256 px (card)** — everything else: gameplay art, stickers and prompt targets, and also letters and numerals, because no rule matches `letter_*` or `numeral_*` and an unmatched key takes this default.
- **512 px (hero)** — any `mascot_*` key, whose scale maths assumes a full-size texture.

The tier rule is applied per key wherever that key lives, not to one fixed set, so art loaded with a game is tiered by the same rule as a shell key. Display code scales from the tier size rather than assuming 512. The rule list and the tier sizes live in one place in the code, and the TDD states them ([TDD §3.4](./TDD.md#34-texture-tiers)).

Story Order's 33 panels are not in the boot set; they travel with that game's chunk (see 7.3). Feelings Faces' four faces are lazy group art, loaded with the game; only its tile icon and its sticker are in the boot set, as they are for every game.

### 7.2 Shell and game chunks

The build produces three kinds of JavaScript:

- **The shell entry**, which contains the three shell scenes (Boot, Preload and Hub), the components the Hub and its settings overlays use, the storage, audio and speech utilities they import, and the 53 boot textures as strings. It is gated at 200 kB minified.
- **A separate Phaser vendor chunk**, so engine bytes are cached across releases and an app update downloads only the shell delta. The build must contain exactly one such chunk.
- **One chunk per game**, plus the chunks the build hoists out of them because several games share the code: `GameSceneBase`, `ChoiceRoundScene`, `GroupMathScene`, `dragJuice`, `dragBoard` and shared game logic such as `wordLogic`, `countLogic` and `shapeSorterLogic`. The shared bases do not ride in the shell.

Measured from the current build, the shell entry is 137.8 kB as `validate-bundle.js` reports it (141.15 kB as Vite prints it) against the 200 kB gate, the Phaser chunk is 1342.6 kB, and the build emits 42 JavaScript chunks in all: the 22 game scenes, nine art-group chunks, the shared bases and logic, the Phaser vendor chunk, the workbox helper and the shell entry. Game chunks range from about 1.4 kB to about 40 kB, the largest being Story Order because it carries its own 33 panel drawings. `validate-bundle.js` prints these numbers on every build, so they can be re-measured rather than trusted from this document.

### 7.3 Art that travels with a game

Game art belongs in the game's chunk when only that game uses it. Two mechanisms move the art out of the shell, and together they move 166 of the app's 219 art files.

**Twelve lazy art groups.** The art that is not shell art is grouped into `shapes`, `cutouts`, `letters`, `numerals`, `animals`, `food`, `items`, `shadows`, `toys`, `faces`, `music` and `glyphs` - 139 keys in all. A scene declares the groups it draws in its own `preload` and hands them to the loader, so the SVG markup lands in that game's lazy chunk instead of the shell. Six of the 139 keys are also shell keys, the profile avatars, so 133 of them are game-only. The loader is idempotent, tracks which scene owns which key so a child who leaves mid-load frees the key for the next attempt, and rasterises every key at its own tier.

**Story Order's own art.** Its 33 panel drawings are imported as raw markup by the story scene and rasterised by that scene's own preload, so the strings live in the lazy chunk instead of the shell.

A scene that asks for art which fails to load falls back to a neutral placeholder rather than Phaser's missing-texture checkerboard, and a shared textless cue is shown while the art loads, so the child sees a deliberate loading mark rather than a broken picture.

The boundary is a test, not a convention: the test suite reads the boot preload's source, pins the 53 shell keys, and fails if the shell ever imports a game-only key.

### 7.4 Runtime targets

| Target | Value |
| --- | --- |
| Frame rate | 60 fps, never below 30 on low-end hardware |
| Cold boot | Under 3 seconds median on a mid-range tablet, enforced in CI |
| Memory | Under 150 MB |
| Touch response | Under 16 ms from tap to visual change |
| Audio response | Under 50 ms from tap to sound |
| Offline | Full play after the first load, including music and font |

The boot budget is not aspirational: CI loads the production build in headless Chromium, samples several cold boots and fails the build if the median exceeds three seconds.

## 8. Release readiness

### 8.1 Gates

A change is ready to merge only when the full chain passes locally and the CI gates pass on the pull request:

```
pnpm check
pnpm typecheck
pnpm test -- --run
pnpm test:coverage
pnpm build
node scripts/validate-bundle.js
node scripts/validate-pwa.js
```

`validate-bundle` enforces the shell budget and the single Phaser vendor chunk. `validate-pwa` checks the manifest, the service worker, the icons, the precached music and the navigation route. CI adds `validate-boot` against a preview server, which enforces the three second median.

### 8.2 Deploy path

Every pull request that touches code runs the gates; documentation-only changes are filtered out of the CI path. A merge to master runs the gates again but does not deploy. Deployment is triggered only by a strict version tag whose commit is on master: CI verifies the lineage, then calls the Coolify deploy webhook with the repository's deploy token. That is why a docs track can merge without a rebuild.

### 8.3 Definition of done

A game or feature is done when: it has a spec entry here and an implementation section in the TDD; it follows the six field template; its narration goes through the single narrator; it respects the touch, motion, audio focus and reduced-motion contracts; its art is either in the boot set with a tier, in a lazy art group with a tier, or in its own chunk; its logic is pure and tested; and the full gate chain passes at the merge commit.

## 9. See also

- [TDD.md](./TDD.md) for the implementation record: scenes, components, storage schema, audio manager, build and PWA configuration.
- [roadmap.md](./roadmap.md) for what is known to be broken and what is planned next.
- `conductor/product.md` for the product overview and the per-milestone changelog.
- `conductor/product-guidelines.md` for voice, tone and visual conventions.
- `conductor/tech-stack.md` for the toolchain.
