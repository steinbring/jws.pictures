#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { exiftool } = require('exiftool-vendored');
const sharp = require('sharp');
const { execSync } = require('child_process');
const xml2js = require('xml2js');

function isFileTracked(filePath) {
  try {
    execSync(`git ls-files --error-unmatch "${filePath}"`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

async function renameOriginalImage(imagePath) {
  console.log('Renaming original image. Image path:', imagePath);
  const dir = path.dirname(imagePath);
  const ext = path.extname(imagePath);
  const base = path.basename(imagePath, ext);
  const newBase = `${base}-original${ext}`;
  const newImagePath = path.join(dir, newBase);
  console.log('New image path:', newImagePath);

  if (!fs.existsSync(imagePath)) {
    console.error('File does not exist:', imagePath);
    process.exit(1);
  }

  const fileTracked = isFileTracked(imagePath);

  if (fileTracked) {
    // Use git mv to rename the file
    execSync(`git mv "${imagePath}" "${newImagePath}"`);
  } else {
    // File is not tracked, move the file and git add
    await fs.move(imagePath, newImagePath);
    execSync(`git add "${newImagePath}"`);
  }

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

  // GPS Location: GPSLatitude and GPSLongitude
  if (tags.GPSLatitude && tags.GPSLongitude) {
    exifData.GPSLocation = {
      Latitude: tags.GPSLatitude,
      Longitude: tags.GPSLongitude,
    };
  } else {
    exifData.GPSLocation = {};
  }

  await exiftool.end();
  return exifData;
}

function getGitCommitInfo(filePath) {
  try {
    // Get the commit hash for the first commit where this file was added
    const commitHash = execSync(
      `git log --diff-filter=A --pretty=format:%H -- "${filePath}"`,
      { encoding: 'utf8' }
    ).trim();

    // Get the commit summary and description
    const commitSummary = execSync(
      `git log -1 --pretty=format:%s ${commitHash}`,
      { encoding: 'utf8' }
    ).trim();

    const commitDescription = execSync(
      `git log -1 --pretty=format:%b ${commitHash}`,
      { encoding: 'utf8' }
    ).trim();

    return {
      commitHash,
      commitSummary,
      commitDescription,
    };
  } catch (error) {
    console.error('Error getting git commit info:', error);
    return {
      commitHash: '',
      commitSummary: '',
      commitDescription: '',
    };
  }
}

async function saveMetadataFiles(exifData, commitInfo, imagePaths, imagePath) {
  const data = {
    filenames: imagePaths.map((p) => path.basename(p)),
    exif: exifData,
    location: commitInfo.commitSummary,
    description: commitInfo.commitDescription,
  };

  const dir = path.dirname(imagePath);
  const base = path.basename(imagePath, path.extname(imagePath)).replace(
    '-original',
    ''
  );
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
  const inputImagePath = process.argv[2];

  if (!inputImagePath) {
    console.error('Please provide an image path.');
    process.exit(1);
  }

  const imagePath = path.resolve(inputImagePath);
  console.log('Resolved image path:', imagePath);

  try {
    // Rename original image
    const originalImagePath = await renameOriginalImage(imagePath);
    console.log('Renamed original image to:', originalImagePath);

    // Generate six versions
    const imagePaths = await generateImages(originalImagePath);
    console.log('Generated images:', imagePaths);

    // Extract EXIF data
    const exifData = await extractExifData(originalImagePath);
    console.log('Extracted EXIF data:', exifData);

    // Get commit info
    const commitInfo = getGitCommitInfo(originalImagePath);
    console.log('Commit info:', commitInfo);

    // Generate JSON and XML files
    const [jsonPath, xmlPath] = await saveMetadataFiles(
      exifData,
      commitInfo,
      imagePaths,
      originalImagePath
    );
    console.log(`Generated metadata files: ${jsonPath}, ${xmlPath}`);
  } catch (error) {
    console.error('Error processing image:', error);
    process.exit(1);
  }
}

main();