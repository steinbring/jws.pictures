#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { exiftool } = require('exiftool-vendored');
const sharp = require('sharp');
const { execSync } = require('child_process');
const xml2js = require('xml2js');

async function renameOriginalImage(imagePath) {
  const dir = path.dirname(imagePath);
  const ext = path.extname(imagePath);
  const base = path.basename(imagePath, ext);
  const newBase = `${base}-original${ext}`;
  const newImagePath = path.join(dir, newBase);

  await fs.move(imagePath, newImagePath);

  // Inform git about the rename
  execSync(`git mv "${imagePath}" "${newImagePath}"`);

  return newImagePath;
}

async function generateImages(imagePath) {
  const dir = path.dirname(imagePath);
  const ext = path.extname(imagePath);
  const base = path.basename(imagePath, ext).replace('-original', '');
  const formats = ['webp', 'jpeg'];
  const sizes = {
    '-large': 1.0,
    '-medium': 0.25,
    '-small': 0.1,
  };
  const newImagePaths = [];

  const image = sharp(imagePath);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;

  const sizePromises = [];

  for (const [suffix, scale] of Object.entries(sizes)) {
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);

    for (const format of formats) {
      const newFilename = `${base}${suffix}.${format}`;
      const newImagePath = path.join(dir, newFilename);

      const resizePromise = image
        .clone()
        .resize(newWidth, newHeight)
        .toFormat(format, { quality: 80 })
        .toFile(newImagePath)
        .then(() => {
          newImagePaths.push(newImagePath);
        });

      sizePromises.push(resizePromise);
    }
  }

  await Promise.all(sizePromises);
  return newImagePaths;
}

async function extractExifData(imagePath) {
  const tags = await exiftool.read(imagePath);
  const exifData = {};

  // Camera: Combine Make and Model
  const make = tags.Make || '';
  const model = tags.Model || '';
  exifData.Camera = `${make} ${model}`.trim();

  // Date and Time: DateTimeOriginal
  exifData.DateTime = tags.DateTimeOriginal || '';

  // Location: GPSLatitude and GPSLongitude
  if (tags.GPSLatitude && tags.GPSLongitude) {
    exifData.Location = {
      Latitude: tags.GPSLatitude,
      Longitude: tags.GPSLongitude,
    };
  } else {
    exifData.Location = {};
  }

  await exiftool.end();
  return exifData;
}

async function saveMetadataFiles(exifData, imagePaths, imagePath) {
  const data = {
    filenames: imagePaths.map((p) => path.basename(p)),
    exif: exifData,
  };

  const dir = path.dirname(imagePath);
  const base = path.basename(imagePath, path.extname(imagePath));
  const jsonPath = path.join(dir, `${base}.json`);
  const xmlPath = path.join(dir, `${base}.xml`);

  // Save JSON
  await fs.writeJson(jsonPath, data, { spaces: 4 });

  // Save XML
  const builder = new xml2js.Builder();
  const xml = builder.buildObject({ metadata: data });
  await fs.writeFile(xmlPath, xml);

  return [jsonPath, xmlPath];
}

async function main() {
  const imagePath = process.argv[2];

  if (!imagePath) {
    console.error('Please provide an image path.');
    process.exit(1);
  }

  try {
    // Rename original image
    const originalImagePath = await renameOriginalImage(imagePath);

    // Generate six versions
    const imagePaths = await generateImages(originalImagePath);

    // Extract EXIF data
    const exifData = await extractExifData(originalImagePath);

    // Generate JSON and XML files
    const [jsonPath, xmlPath] = await saveMetadataFiles(
      exifData,
      imagePaths,
      originalImagePath
    );

    console.log(`Generated images: ${imagePaths.join(', ')}`);
    console.log(`Generated metadata files: ${jsonPath}, ${xmlPath}`);
  } catch (error) {
    console.error('Error processing image:', error);
    process.exit(1);
  }
}

main();