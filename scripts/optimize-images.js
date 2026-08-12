const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_DIR = path.join(__dirname, '../fotos');
const PUBLIC_DIR = path.join(__dirname, '../public/images');

const PERSONAL_SRC_NEW = path.join(__dirname, '../pagweb/Personal');
const PERSONAL_SRC_OLD = path.join(SOURCE_DIR, 'PERSONAL');

const TRABAJO_SRC_NEW = path.join(__dirname, '../pagweb/Trabajo');
const TRABAJO_SRC_OLD = path.join(SOURCE_DIR, 'TRABAJO');

const COVER_SRC = path.join(SOURCE_DIR, 'PORTADA.jpg');

const PERSONAL_OUT = path.join(PUBLIC_DIR, 'personal');
const TRABAJO_OUT = path.join(PUBLIC_DIR, 'trabajo');

// Helper to format title from filename
function formatTitle(filename) {
  // Remove extension
  const base = path.parse(filename).name;
  // Strip leading digits followed by space, underscore or hyphen (e.g. "01_Title" -> "Title")
  let cleanBase = base.replace(/^\d+[\s_]+/, '');
  // Replace underscores or multiple spaces with single space
  let formatted = cleanBase.replace(/[_-]+/g, ' ');
  // Title case it roughly
  return formatted.trim();
}

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Helper to read and sort files alphabetically
function getSortedFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(file => {
      const fullPath = path.join(dir, file);
      return fs.statSync(fullPath).isFile() && !file.startsWith('.');
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
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

  const manifest = { personal: [], trabajo: [] };

  // Process Personal Directories (New then Old)
  let pIdx = 1;
  const personalNewFiles = getSortedFiles(PERSONAL_SRC_NEW);
  console.log(`Found ${personalNewFiles.length} new items in pagweb/Personal. Optimizing...`);
  for (const file of personalNewFiles) {
    const fullPath = path.join(PERSONAL_SRC_NEW, file);
    const item = await processImage(fullPath, PERSONAL_OUT, 'personal', pIdx);
    if (item) {
      manifest.personal.push(item);
      pIdx++;
    }
  }

  const personalOldFiles = getSortedFiles(PERSONAL_SRC_OLD);
  console.log(`Found ${personalOldFiles.length} old items in fotos/PERSONAL. Optimizing...`);
  for (const file of personalOldFiles) {
    const fullPath = path.join(PERSONAL_SRC_OLD, file);
    const item = await processImage(fullPath, PERSONAL_OUT, 'personal', pIdx);
    if (item) {
      manifest.personal.push(item);
      pIdx++;
    }
  }

  // Process Trabajo Directories (New then Old)
  let tIdx = 1;
  const trabajoNewFiles = getSortedFiles(TRABAJO_SRC_NEW);
  console.log(`Found ${trabajoNewFiles.length} new items in pagweb/Trabajo. Optimizing...`);
  for (const file of trabajoNewFiles) {
    const fullPath = path.join(TRABAJO_SRC_NEW, file);
    const item = await processImage(fullPath, TRABAJO_OUT, 'trabajo', tIdx);
    if (item) {
      manifest.trabajo.push(item);
      tIdx++;
    }
  }

  const trabajoOldFiles = getSortedFiles(TRABAJO_SRC_OLD);
  console.log(`Found ${trabajoOldFiles.length} old items in fotos/TRABAJO. Optimizing...`);
  for (const file of trabajoOldFiles) {
    const fullPath = path.join(TRABAJO_SRC_OLD, file);
    const item = await processImage(fullPath, TRABAJO_OUT, 'trabajo', tIdx);
    if (item) {
      manifest.trabajo.push(item);
      tIdx++;
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
