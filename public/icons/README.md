# PWA Icons

To complete the PWA setup, you need to generate PNG icons from the SVG.

## Quick Fix (For Development/Viva)

You can use any online tool to generate icons, or use this simple Node.js script:

```bash
npm install sharp
```

Then create a file `scripts/generate-icons.js`:

```javascript
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, "../public/icons/icon.svg");
const outputDir = path.join(__dirname, "../public/icons");

sizes.forEach((size) => {
  sharp(inputSvg)
    .resize(size, size)
    .png()
    .toFile(path.join(outputDir, `icon-${size}x${size}.png`))
    .then(() => console.log(`Generated ${size}x${size}`))
    .catch((err) => console.error(`Error generating ${size}:`, err));
});
```

Run it with:

```bash
node scripts/generate-icons.js
```

## Alternative: Manual Creation

For the viva demo, you can simply:

1. Go to https://realfavicongenerator.net/
2. Upload any square image (512x512 recommended)
3. Download and extract to `/public/icons/`

## Minimum Required Icons

- icon-192x192.png (required for Android)
- icon-512x512.png (required for splash screen)
