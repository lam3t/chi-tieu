import sharp from "sharp";
import fs from "fs";
import path from "path";

const svgPath = path.resolve("public/icons/icon.svg");
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile("public/icons/icon-192.png");

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile("public/icons/icon-512.png");

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile("public/icons/icon-maskable.png");

  console.log("PWA Icons generated successfully!");
}

generate().catch(console.error);
