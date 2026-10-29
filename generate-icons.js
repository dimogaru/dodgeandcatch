const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const sizes = [
  { folder: "mipmap-mdpi", size: 48 },
  { folder: "mipmap-hdpi", size: 72 },
  { folder: "mipmap-xhdpi", size: 96 },
  { folder: "mipmap-xxhdpi", size: 144 },
  { folder: "mipmap-xxxhdpi", size: 192 }
];

const inputIcon = path.join(__dirname, "icon-512x512.png");
const androidRes = path.join(__dirname, "android/app/src/main/res");

async function generate() {
  for (const item of sizes) {
    const dir = path.join(androidRes, item.folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await sharp(inputIcon)
      .resize(item.size, item.size)
      .toFile(path.join(dir, "ic_launcher.png"));
    await sharp(inputIcon)
      .resize(item.size, item.size)
      .toFile(path.join(dir, "ic_launcher_round.png"));
    await sharp(inputIcon)
      .resize(item.size, item.size)
      .toFile(path.join(dir, "ic_launcher_foreground.png"));
  }
  console.log("Iconos de Android generados correctamente con la estrella neón.");
}

generate().catch(console.error);
