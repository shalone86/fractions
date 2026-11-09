# Fraction Feast 🥧

Free fraction games for kids in grades 1 to 3, with everything read aloud. Part of [Angelio](https://angelio.org). Play it at **[angelio.org/fractions/](https://angelio.org/fractions/)**.

| Grade | Levels |
|---|---|
| 1 | **Fair Shares?** (equal parts or not) · **Halves & Fourths** (shade one part) |
| 2 | **How Many Parts?** (halves, thirds, fourths) · **Shade It!** (shade two thirds, three fourths…) |
| 3 | **Name the Fraction** · **Number Line** (0 to 1) · **Equal Fractions** · **Bigger or Smaller?** |

The top number is always orange (the parts we have) and the bottom number blue (the equal parts in all). Each level starts with a short "How it works" card. A mistake gets a hint, and a second mistake shows the answer with an explanation.

## Code

Plain HTML, CSS and ES modules in `public/`, with no build step. It's built on the [Angelio app template](https://github.com/shalone86/app-template).

- `public/js/fractions.js`: levels, question generator and fraction words. Pure logic, tested in `test/`.
- `public/js/draw.js`: SVG circles, rectangles and bars cut into parts.
- `public/js/lessons.js`: the "How it works" cards.
- `public/js/app.js`: screens and interactions.
- `worker/`: Cloudflare Worker for the read-aloud voice (optional; the device voice works without it).

```bash
npm install
npm test
python3 -m http.server -d public 8787   # or: npm run dev
npx wrangler deploy
```

## License

MIT, see [LICENSE](LICENSE). The name "Angelio" and its logo are not part of the license.
