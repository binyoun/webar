# WebAR Studio: Student Guide

**Creative Photography · RMIT Vietnam**

Your printed photograph becomes an AR marker. When a visitor points their
phone camera at your print, a second layer of the work appears on top of it:
a video, another image, or a 3D object. No app is installed. The work lives
on the open web, and the exhibition wall is the interface.

This guide takes you from a finished photograph to an exhibited AR work in
five steps. Budget about 45 minutes the first time.

---

## Step 1: Choose your target photograph

The tracking engine (MindAR) recognizes your photo by its visual features.
Not every image tracks well. Before committing, check your candidate against
this list:

- **Rich in detail and texture.** Busy surfaces track well. Large flat areas
  (sky, plain walls, studio backdrops) track poorly.
- **High contrast.** Strong tonal range beats soft, low-contrast images.
- **Asymmetric.** Avoid images that look similar when rotated.
- **Matte print.** Glossy paper reflects gallery lights and breaks tracking.

A quick test: squint at your image. If you can still tell what it is and
where things are, it will probably track. If it dissolves into a soft field,
choose differently or crop tighter.

Export a jpg around 1000 to 2000 px on the long edge. Name it with your slug,
for example `linh-canal-morning.jpg`.

## Step 2: Compile the tracking file (.mind)

1. Open the MindAR Image Target Compiler:
   `https://hiukim.github.io/mind-ar-js-doc/tools/compile/`
2. Drop in your jpg and press **Start**.
3. Watch the feature-point preview: the dots show what the engine will
   recognize. Few dots or dots clustered in one corner means go back to
   Step 1 and choose a stronger image.
4. Download the compiled `targets.mind` file and rename it to your slug:
   `linh-canal-morning.mind`.

Put both files in `assets/targets/`.

## Step 3: Prepare your overlay

Choose one:

| Type | File | Notes |
|---|---|---|
| video | `.mp4`, H.264 | Under 15 MB. It autoplays muted when the target is found and pauses when lost. Same aspect ratio as your print looks strongest. |
| image | `.jpg` / `.png` | A second photograph resting on the first: before/after, day/night, presence/absence. |
| model | `.glb` | A 3D object growing out of the photographic surface. Keep under 10 MB. |

Put the file in `assets/overlays/`, named with your slug.

## Step 4: Register your work in config.json

Add one entry to the `works` array. Copy an example entry and change the
values. The only geometry you must get right:

- `width` is always `1` (one unit = the width of your printed photo)
- `height` = your image height divided by its width.
  Portrait A4/A3 print: `1.4142`. Landscape 3:2 photo: `0.6667`.

Commit and push. That is the entire integration.

## Step 5: Test, print, exhibit

**Test.** Open the GitHub Pages URL on your phone (AR requires https, so
test on the deployed site, not a local file). Open your work from the
gallery, point the camera at your image on a second screen or a test print.

**Print.** Matte paper, A4 or larger. Small prints force visitors
uncomfortably close.

**Label.** On the gallery page, press **qr label** on your card and print
the QR code beside your work, with title, name, year.

**Watch.** During the exhibition, observe how visitors hold their phones,
how long they stay, when the layer surprises them. That observation is
part of your documentation, and it is assessable.

---

## Why this is photography

A photograph has always been a time-object: it holds a moment still. Here
the print becomes a threshold instead of an endpoint. The still image is
the door; what you attach to it is the room. Think about the relationship
between the two layers as carefully as you think about your exposure:
what does the moving layer reveal that the still layer withholds?

## Troubleshooting

- **Camera never opens** -> you are on http or file://. Use the
  GitHub Pages https URL.
- **Scanning never locks** -> weak target. Recompile and check the
  feature-point preview (Step 2.3), or reprint on matte paper.
- **Video is silent** -> intentional. Mobile browsers require muted
  autoplay. Design for silence, or add a tap-for-sound interaction as an
  extension exercise.
- **Overlay floats offset from the print** -> your `height` value does
  not match the image's real aspect ratio.

---
---

# Part 2: Experiments

The core workflow (Part 1) puts one layer on one photograph. Part 2 opens
the studio's own toolbox: six techniques, each drawn from a real work made
in this practice, each available in two forms:

- a **standalone experiment page** in `/experiments/` that you can read
  whole, run on your phone, and modify
- a **config option** in the AR viewer, so any technique can be attached
  to your Part 1 work with a few lines of JSON

The rule for this unit: **read the code before you run it.** Every page is
under 150 lines and commented for reading. The code is course material, not
infrastructure.

| # | Experiment | Lineage work | Config hook |
|---|---|---|---|
| 01 | NFC writer | Sacred Tree (NTAG215 floor inlays) | none needed: a tag stores your work's URL |
| 02 | GPS fence | Gelora Mycelium Network | `"trigger": {"type":"gps","lat":..,"lng":..,"radius":60}` |
| 03 | Compass | geloracompass | `"trigger": {"type":"compass","heading":90,"tolerance":15}` |
| 04 | Sonify | Vanishing Waters / Perforated Atlas | `"audio": {"type":"sonify","source":"your sentence"}` |
| 05 | Lenses | SELECT PERCEPTION ENGINE | `"overlay": {"type":"lenses","lenses":[..]}` |
| 06 | Lookup | mansion-finder (28 lunar mansions) | standalone page linking into the gallery |

## 01 · NFC: touch as the trigger

A blank NTAG215 tag costs almost nothing and stores one URL. Write your
work's address to it with `experiments/01-nfc-writer.html` (Chrome on
Android writes; every modern phone reads). Concept to carry from Sacred
Tree: visitors will touch the tag with their hands, not their phones, and
that productive misunderstanding is material, not error. Decide what the
wrong gesture means in your work before the exhibition decides for you.

**Exercise:** mount one tag behind your print so the photograph itself is
what gets tapped. Document three first-time visitors' hands.

## 02 · GPS: place as the key

`experiments/02-gps-fence.html` shows the entire mathematics of a geofence:
one haversine function and a circle's radius. Add a `trigger` of type `gps`
to your config entry and your work refuses to open away from its site; the
visitor sees only their distance, counting down as they walk. Urban GPS is
±10 to 30 m, so treat the inaccuracy as weather, not as a bug.

**Exercise:** fence your work to the exact place its photograph was made,
then exhibit the print across the city. Write 200 words on which half of
the work the visitor experiences.

## 03 · Compass: the body as a dial

`experiments/03-compass.html` reads the phone's absolute heading and asks
the visitor to turn until they face a bearing. With a `compass` trigger in
config, your work opens only when the body is oriented. The obangsaek
mapping (east/wood/blue-green, south/fire/red, center/earth/yellow,
west/metal/white, north/water/black) turns a sensor API into a cosmology.

**Exercise:** choose the direction your work should face and justify it in
one paragraph using any directional system you can defend, five phases,
qibla, feng shui, or the direction of your grandmother's house.

## 04 · Sonify: deterministic translation

`experiments/04-sonify.html` is the Vanishing Waters mechanism at teaching
scale: a sentence becomes a melody by a fixed rule (character code modulo
scale length), rendered as sound and a visual perforation strip. No
randomness, no AI, and that is the argument: the memory owns its sound
because the rule never changes. Attach it to your AR work with an `audio`
field; the melody plays when the target is found (after one tap to arm,
because mobile browsers require a gesture before audio).

**Exercise:** sonify the same memory in two languages. Present both
melodies and ask the class which one is the translation.

## 05 · Lenses: interpretation as material

`experiments/05-lenses.html` is SELECT PERCEPTION ENGINE reduced to its
skeleton: one photograph, several named fictional engines, each with a
tint and a voice. The code is a carousel; the writing is the work. In the
AR viewer, overlay type `lenses` floats your interpretive layers on the
physical print, and visitors tap through machines.

**Exercise:** write three engines for your Part 1 photograph. At least one
must read the image the way a specific person in your life would. Discuss:
is that engine less objective than a surveillance model, or differently
objective?

## 06 · Lookup: assigned by a rule older than you

`experiments/06-lookup.html` maps a birthdate to one of the five phases and
sends the visitor to whichever classmate's work that phase points to. It is
mansion-finder simplified until the whole mechanism fits on one screen:
personal datum, fixed rule, position in a cosmology, assigned work. The
visitor does not choose; they are found.

**Exercise:** as a class, curate the phase-to-work mapping for your
exhibition and defend it as a collective curatorial statement. Then put the
lookup page on a tablet at the entrance.

## Combining modules

Modules stack. A work can be GPS-fenced AND sonified; compass-gated AND
multi-lens. But every added condition costs visitors, and the gates exist
to mean something, not to demonstrate that they work. House rule: you may
use at most two modules per work, and your artist statement must justify
each one in a sentence. If the sentence is about technology, cut the module.

## Studio mode

Every trigger gate shows a "studio mode: continue anyway" button so the
class can test works at their desks. It stays visible in exhibition too,
deliberately: a visitor who bypasses the walk still meets the work, just
without earning it. If you want a hard gate for your concept, remove the
button in `js/ar-app.js` and defend the exclusion in your statement.
