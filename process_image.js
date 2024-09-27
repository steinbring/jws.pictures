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
  exifData.DateTime = tags.DateTimeOriginal ? tags.DateTimeOriginal.toString() : '';

  // GPS Location: GPSLatitude and GPSLongitude
  if (tags.GPSLatitude && tags.GPSLongitude) {
    exifData.GPSLocation = {
      Latitude: tags.GPSLatitude.toString(),
      Longitude: tags.GPSLongitude.toString(),
    };
  } else {
    exifData.GPSLocation = ''; // Set to empty string instead of empty object
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

function cleanDataForXml(obj) {
  if (Array.isArray(obj)) {
    return obj.map(cleanDataForXml);
  } else if (obj && typeof obj === 'object') {
    // If object is empty, return empty string
    if (Object.keys(obj).length === 0) {
      return '';
    }
    const newObj = {};
    for (const key in obj) {
      // Replace invalid characters in keys
      let cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
      // Ensure the key does not start with a number
      if (/^[0-9]/.test(cleanKey)) {
        cleanKey = '_' + cleanKey;
      }
      newObj[cleanKey] = cleanDataForXml(obj[key]);
    }
    return newObj;
  } else {
    // Convert non-primitive values to strings
    return obj != null ? obj.toString() : '';
  }
}

async function saveMetadataFiles(exifData, commitInfo, imagePaths, imagePath) {
  const dir = path.dirname(imagePath);
  const ext = path.extname(imagePath);
  const baseNameWithOriginal = path.basename(imagePath, ext); // Includes '-original'
  const baseName = baseNameWithOriginal.replace('-original', '');

  // Extract ID (filename minus extension)
  const id = baseName.split('.').slice(0, -1).join('.');

  const data = {
    ID: id,
    filenames: { filename: imagePaths.map((p) => path.basename(p)) },
    exif: exifData,
    location: commitInfo.commitSummary,
    description: commitInfo.commitDescription,
  };

  const jsonPath = path.join(dir, `${baseName}.json`);
  const xmlPath = path.join(dir, `${baseName}.xml`);

  // Save JSON
  await fs.writeJson(jsonPath, data, { spaces: 4 });

  // Clean data for XML
  const dataForXml = cleanDataForXml({ metadata: data });

  console.log('Data for XML:', JSON.stringify(dataForXml, null, 2));

  // Build XML
  const builder = new xml2js.Builder({
    cdata: true, // Wrap string values containing special characters in CDATA sections
  });
  const xml = builder.buildObject(dataForXml);
  await fs.writeFile(xmlPath, xml);

  // Update aggregate files
  await updateAggregateFiles(data, imagePath);

  return [jsonPath, xmlPath];
}

async function updateAggregateFiles(data, imagePath) {
  const year = path.basename(path.dirname(imagePath));
  const photosDir = path.join(path.dirname(imagePath), '..'); // Assuming /photos/[year]/image.jpg

  // Paths for aggregate files
  const allJsonPath = path.join(photosDir, 'all.json');
  const allXmlPath = path.join(photosDir, 'all.xml');
  const yearJsonPath = path.join(photosDir, `${year}.json`);
  const yearXmlPath = path.join(photosDir, `${year}.xml`);

  // Update JSON files
  await updateJsonAggregateFile(allJsonPath, data);
  await updateJsonAggregateFile(yearJsonPath, data);

  // Update XML files
  await updateXmlAggregateFile(allXmlPath, data);
  await updateXmlAggregateFile(yearXmlPath, data);
}

async function updateJsonAggregateFile(filePath, newData) {
  let aggregateData = [];

  if (await fs.pathExists(filePath)) {
    aggregateData = await fs.readJson(filePath);
    if (!Array.isArray(aggregateData)) {
      aggregateData = [];
    }
  }

  // Append new data
  aggregateData.push(newData);

  // Save updated aggregate data
  await fs.writeJson(filePath, aggregateData, { spaces: 4 });
}

async function updateXmlAggregateFile(filePath, newData) {
  let aggregateData = { items: { metadata: [] } };

  if (await fs.pathExists(filePath)) {
    const xmlContent = await fs.readFile(filePath, 'utf8');
    const parser = new xml2js.Parser({ explicitArray: false });
    aggregateData = await parser.parseStringPromise(xmlContent);
    if (!aggregateData || !aggregateData.items || !aggregateData.items.metadata) {
      aggregateData = { items: { metadata: [] } };
    } else if (!Array.isArray(aggregateData.items.metadata)) {
      aggregateData.items.metadata = [aggregateData.items.metadata];
    }
  }

  // Clean new data
  const cleanNewData = cleanDataForXml({ metadata: newData });

  // Append new data
  aggregateData.items.metadata.push(cleanNewData.metadata);

  // Save updated aggregate data
  const builder = new xml2js.Builder({
    cdata: true,
  });
  const xml = builder.buildObject(aggregateData);
  await fs.writeFile(filePath, xml);
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
