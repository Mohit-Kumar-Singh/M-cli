// Generates Milk Garage app icons from an inline SVG.  Run: npm run icons
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

const GREEN = "#1f6f5c";
const CREAM = "#f7f4ec";
const GOLD = "#e4b24a";

/** The mark: a milk bottle on a spruce-green tile. `radius` rounds the tile
 *  (browser favicon); maskable/apple builds pass 0 and rely on the platform. */
const svg = (radius) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${radius}" fill="${GREEN}"/>
  <g>
    <path fill="${CREAM}" d="
      M222 120 h68 v34
      a44 44 0 0 0 12 30 l14 15
      a48 48 0 0 1 13 33 v106
      a26 26 0 0 1 -26 26 h-116
      a26 26 0 0 1 -26 -26 v-106
      a48 48 0 0 1 13 -33 l14 -15
      a44 44 0 0 0 12 -30 z"/>
    <rect x="210" y="92" width="92" height="32" rx="9" fill="${GOLD}"/>
    <rect x="176" y="306" width="160" height="18" rx="6" fill="${GREEN}" opacity="0.92"/>
  </g>
</svg>`;

async function main() {
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "favicon.svg"), svg(112).trim());

  const rounded = Buffer.from(svg(96));
  const square = Buffer.from(svg(0));

  const jobs = [
    ["icon-192.png", rounded, 192],
    ["icon-512.png", rounded, 512],
    ["maskable-512.png", square, 512],
    ["apple-touch-icon.png", square, 180],
    ["favicon-48.png", rounded, 48],
  ];
  for (const [name, buf, size] of jobs) {
    await sharp(buf).resize(size, size).png().toFile(join(outDir, name));
    console.log("wrote", name);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
