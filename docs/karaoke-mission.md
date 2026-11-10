# Karaoke Mission

The fourth Music & Movement mission (Jupiter, `music-karaoke`). The sung Nursery Rhymes mission and its audio assets have been removed. Karaoke retains its Jupiter artwork, stable progress key, ten tracks and player behaviour. The other three music mission keys remain intact. Karaoke is also available in the music activity menu.

Ten tracks: ABC — The Alphabet Song; Twinkle, Twinkle, Little Star; Baa, Baa, Black Sheep; Mary Had a Little Lamb; Row, Row, Row Your Boat; Are You Sleeping?; London Bridge Is Falling Down; Hot Cross Buns; Here We Go Round the Mulberry Bush; Polly Put the Kettle On. Wheels on the Bus and I Love a Rainbow are excluded because their composition rights were not cleared for this set.

Original instrumental arrangements are rendered by scripts/render-karaoke.py using only mathematical oscillators, melody notes and gentle arpeggiated harmony. No external audio, soundfont, sample, vocalist or model is used. The underlying tunes are traditional public-domain melodies; source references are in the per-song data and visible credits page. The backing tracks are original Oatle Kids recordings, not a dedication or transfer of the user's rights. The historic versions referenced may differ from the familiar melody variants used in these arrangements.

The renderer generates both audio and lyric cues from the same note schedule. The player samples HTMLAudioElement.currentTime during playback, so the words stay synced through pauses and buffering. ABC highlights individual letters, including the fast L-M-N-O-P passage. Four gentle introductory beats and numbered dots prepare the child. Count-in space remains reserved so controls do not jump when singing begins. The cue for the next line remains visible.

No autoplay, microphone or recording. Play toggles pause/resume; Restart returns to the count-in; choosing another track stops and resets the current song. Audio pauses on back, finish, background, muted mode and unmount. Failed playback supports retry. Completing one song enables the tick; the child need not sing all ten. Replays do not increase the completed-song count. Finishing uses the app's existing mission completion callback. UI respects safe areas and supports narrow phones and landscape.

Validation: ten MP3 decode and duration checks; per-file SHA-256 checks; every word midpoint and all 26 ABC letter cues; preservation of the four remaining mission keys and all ten karaoke audio hashes; mounted components covering playback, pause/resume, restart, retry, completion, mute, background and cleanup; browser playback showing audio-time-aligned letter highlighting; phone and desktop layout checks; lint and production build.


## Song artwork
Original toy-style SVG illustrations replace the ten emoji icons. The original short instrumental arrangements and matching lyric timings are restored.
