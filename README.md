# Disco Shift

A two-button music game made for **GitHub Game Off 2026** (theme: **SHIFT**).

It's the morning after the party. The song in her head is broken: too high, too slow, out of focus, echoing. Fix it level by level, then dance and hear the song the way you fixed it.

**Play in the browser:** [kugalab.itch.io/disco-shift](https://kugalab.itch.io/disco-shift)

## Controls

Two buttons only:

- **Left Shift / Right Shift**
- or the arrow keys **← / →**
- or tap the **left / right side** of the screen

On some levels a short tap and a hold do different things. The controls for each level are shown before it starts.

Sticky Keys popping up? Use the arrow keys.

## Levels

Every level shifts something different, and you can hear it in the song while you play:

1. **Tune it up or down:** pitch and volume
2. **Make it faster or slower:** speed (a needle that keeps slipping)
3. **Line up the colors:** four spotlights split her into four colors
4. **Morning or night? Catch the light:** switch between day and night
5. **Straighten the view:** perspective
6. **Move where she points:** left / right, against the echo
7. **Free dance:** no score, just tap and play

At the end you get your score (the average of the six levels) and a replay of the song as you fixed it. Anything you left broken stays broken in the replay.

## Tech

- One self-contained HTML file: plain JavaScript, Canvas 2D and the Web Audio API (with an AudioWorklet pitch shifter)
- No engine, no libraries, no server
- Works on desktop and mobile, in a portrait layout

### Build

```
python3 build.py              # builds disco-full.html
python3 build.py test N START # test build of level N, starting at START seconds of the song
```

### Files

- `script16_head.js`, `script16_tail.js`: game code (levels, audio, drawing)
- `head_part3.html`: page, styles and intro screens
- `poses16.json`: her 16 poses (packed PNG images)
- `clip6.mp3`: the song
- `build.py`: puts everything together into one HTML file

## AI disclosure

This game was made with the help of AI tools:

- **Code:** written with Claude (Anthropic), directed, tested and tuned by me
- **Her poses:** generated with ChatGPT image generation, then edited
- **Music:** "Disco Hurricane", my song made with Suno

The idea, the game design, the level rules and all the testing are mine.

## Credits

**Kuga Lab — Independent Creative Works**
*Different forms. One restless imagination.*

## License

- **Code:** MIT License
- **Song, lyrics and images:** © Kuga Lab, all rights reserved
