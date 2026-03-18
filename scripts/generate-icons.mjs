/**
 * Run once: node scripts/generate-icons.mjs
 * Generates PNG icons for the PWA manifest from public/icons/icon.svg
 * Requires: npm install sharp --save-dev
 */
import sharp from "sharp";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(join(__dirname, "../public/icons/icon.svg"));
const out = join(__dirname, "../public/icons");

const sizes = [192, 512];
await Promise.all(
  sizes.map((s) =>
    sharp(svg).resize(s, s).png().toFile(join(out, `icon-${s}.png`))
  )
);

// Placeholder screenshot (1280x800 dark canvas)
await sharp({
  create: { width: 1280, height: 800, channels: 4, background: { r: 30, g: 29, b: 24, alpha: 1 } },
})
  .png()
  .toFile(join(out, "screenshot-wide.png"));

console.log("✅ PWA icons generated in public/icons/");
