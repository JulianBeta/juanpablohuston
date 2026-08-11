const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_DIR = path.join(__dirname, '../fotos');
const PUBLIC_DIR = path.join(__dirname, '../public/images');

const PERSONAL_SRC = path.join(SOURCE_DIR, 'PERSONAL');
const TRABAJO_SRC = path.join(SOURCE_DIR, 'TRABAJO');
const COVER_SRC = path.join(SOURCE_DIR, 'PORTADA.jpg');

const PERSONAL_OUT = path.join(PUBLIC_DIR, 'personal');
const TRABAJO_OUT = path.join(PUBLIC_DIR, 'trabajo');

// Helper to format title from filename
function formatTitle(filename) {
  // Remove extension
  const base = path.parse(filename).name;
  // Replace underscores or multiple spaces with single space
  let formatted = base.replace(/[_-]+/g, ' ');
  // Title case it roughly
  return formatted.trim();
}

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function processImage(srcPath, destDir, idPrefix, index) {
  const ext = path.extname(srcPath).toLowerCase();
  if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png' && ext !== '.tif' && ext !== '.tiff') {
    return null;
  }

  const filename = path.parse(srcPath).name;
  const webpFilename = `${filename}.webp`;
  const thumbFilename = `${filename}_thumb.webp`;

  const webpPath = path.join(destDir, webpFilename);
  const thumbPath = path.join(destDir, thumbFilename);

  try {
    const image = sharp(srcPath);
    const metadata = await image.metadata();

    // Optimize full size
    // Max width 1600px, keeping aspect ratio
    await image
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(webpPath);

    // Optimize thumbnail
    // Max width 400px, keeping aspect ratio
    await sharp(srcPath)
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(thumbPath);

    // Get final output metadata to know width & height for React Image component
    const outputMeta = await sharp(webpPath).metadata();

    return {
      id: `${idPrefix}-${index}`,
      title: formatTitle(path.basename(srcPath)),
      width: outputMeta.width || metadata.width,
      height: outputMeta.height || metadata.height,
      src: `/images/${idPrefix}/${webpFilename}`,
      thumbnail: `/images/${idPrefix}/${thumbFilename}`,
    };
  } catch (err) {
    console.error(`Error processing ${srcPath}:`, err);
    return null;
  }
}

async function run() {
  console.log('Starting image optimization process...');
  await ensureDir(PERSONAL_OUT);
  await ensureDir(TRABAJO_OUT);

  // Process Cover
  if (fs.existsSync(COVER_SRC)) {
    console.log('Processing cover image...');
    await sharp(COVER_SRC)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(PUBLIC_DIR, 'cover.webp'));
    console.log('Cover image optimized.');
  } else {
    console.warn('Cover image PORTADA.jpg not found.');
  }

  // Process Personal Directory
  const manifest = { personal: [], trabajo: [] };
  if (fs.existsSync(PERSONAL_SRC)) {
    const files = fs.readdirSync(PERSONAL_SRC);
    console.log(`Found ${files.length} items in PERSONAL. Optimizing...`);
    let idx = 1;
    for (const file of files) {
      const fullPath = path.join(PERSONAL_SRC, file);
      if (fs.statSync(fullPath).isFile()) {
        const item = await processImage(fullPath, PERSONAL_OUT, 'personal', idx);
        if (item) {
          manifest.personal.push(item);
          idx++;
        }
      }
    }
  }

  // Process Trabajo Directory
  if (fs.existsSync(TRABAJO_SRC)) {
    const files = fs.readdirSync(TRABAJO_SRC);
    console.log(`Found ${files.length} items in TRABAJO. Optimizing...`);
    let idx = 1;
    for (const file of files) {
      const fullPath = path.join(TRABAJO_SRC, file);
      if (fs.statSync(fullPath).isFile()) {
        const item = await processImage(fullPath, TRABAJO_OUT, 'trabajo', idx);
        if (item) {
          manifest.trabajo.push(item);
          idx++;
        }
      }
    }
  }

  // Save manifest.json
  const manifestPath = path.join(PUBLIC_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Manifest created successfully at ${manifestPath}`);
  console.log(`Optimized ${manifest.personal.length} personal images.`);
  console.log(`Optimized ${manifest.trabajo.length} trabajo images.`);
}

run().catch(console.error);
