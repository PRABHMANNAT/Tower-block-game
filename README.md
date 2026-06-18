# Tower Block Game

A browser-based tower stacking game built with HTML5 Canvas and vanilla JavaScript.

## Play

Open `index.html` in any modern browser. No build step, no dependencies.

## Controls

| Action | Input |
| --- | --- |
| Drop block | Click / Tap / Space / Enter / ArrowDown |
| Toggle sound | Sound button (top-right) |
| Restart | Click / tap after game over |

## How it works

A new colored block slides across the top of the screen. When you drop it,
any portion that overhangs the block below is trimmed off and tumbles away.
Stack as high as you can — the moving block speeds up each turn, and the
playable width keeps shrinking. Perfect drops chain into a combo for bonus
points.

## Features

- Pixel-sharp rendering on high-DPI displays
- Rainbow color cycling per floor
- Perfect-drop particles, screen flash, and combo multiplier
- Falling fragment debris with rotation and gravity
- Smooth camera follow as the tower grows
- Local-best score persistence via `localStorage`
- WebAudio beeps with mute toggle
- Mobile touch support and responsive sizing
- Pause on window blur

## Files

- `index.html` — page shell
- `styles.css` — layout, button, footer
- `game.js` — game logic and rendering
- `favicon.svg` — icon

## License

MIT — see [LICENSE](LICENSE).
