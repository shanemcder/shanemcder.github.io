YOUNG TURKS — SHANE MCDERMOTT

Upload the contents of this folder to your website. Keep index.html,
visualizer.js, analysis.json, and young-turks.mp3 together. Restore your
existing resume.pdf alongside them to keep the resume download working.

Local preview: run python3 -m http.server 8000 in this folder, then open
http://localhost:8000. Opening index.html directly will not load analysis.json.

Play fades the portfolio to black. Pause/Resume holds the song position.
Exit or Escape returns to the portfolio. Space toggles playback when focus
is outside a button or input. The slider seeks; Gentle visuals reduces motion
and brightness and is enabled automatically for reduced-motion preferences.

The supplied 15 stems are each 88.888875 seconds long. Playback uses a 320 kbps
MP3 made by summing all stems with a constant gain of 0.687895 to prevent
clipping. This is a stem mix, not the earlier 2:38 mastered WAV. The piano
remains audible but has no visual. Any processing baked into the exported
stems remains; master-bus processing not baked in cannot be reconstructed.

Visuals use each original stem's amplitude sampled at 60 frames per second,
indexed by the audio player's actual playback position. This keeps all
instruments synchronized without downloading or decoding 15 large WAVs.
No microphone, external services, or dependencies are needed at runtime.

4_guitar: evolving colors, drifting clouds
ezra_fuzz: golden clouds
blitz: green left-to-right streak, tremolo brightness
boom_fx: soft white expanding pulse
bright_synth_strings: rose flowing veil
Classic Electric Piano_1: no visuals
chord_arp: orange pulse
drums: coral impacts
ezra_main: indigo clouds
ne_growl: red pulse
ne_main: light blue scattered dots
sidechain: subtle cyan breathing field
synth_hat: light green sparks
synthetic_bass: dark yellow flowing mass
bass_drop: orange swell

Edit mappings in visualizer.js to change colors or behavior. Shapes travel
organically rather than occupying fixed instrument positions. Pulses follow
stem amplitude changes; tremolo in blitz is an additional visual oscillation.

Validation: audio lengths and combined peak checked; JavaScript syntax and
simulated canvas rendering checked. A real browser playback/visual review
could not be run in the build environment; try the local preview before upload.
