const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Optimize image by resizing and compressing
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path to output image
 * @param {Object} options - Optimization options
 */
async function optimizeImage(inputPath, outputPath, options = {}) {
  const {
    width = 400,
    height = 300,
    quality = 80,
    format = 'jpeg'
  } = options;

  try {
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality })
      .toFile(outputPath);
    
    console.log(`Image optimized: ${inputPath} -> ${outputPath}`);
    return true;
  } catch (error) {
    console.error('Error optimizing image:', error);
    return false;
  }
}

/**
 * Create multiple sizes of an image
 * @param {string} inputPath - Path to input image
 * @param {string} baseOutputPath - Base path for output images
 */
async function createImageVariants(inputPath, baseOutputPath) {
  const variants = [
    { width: 200, height: 150, suffix: '_thumb' },
    { width: 400, height: 300, suffix: '_medium' },
    { width: 800, height: 600, suffix: '_large' }
  ];

  const results = [];
  
  for (const variant of variants) {
    const outputPath = baseOutputPath.replace(/(\.[^.]+)$/, `${variant.suffix}$1`);
    
    try {
      await optimizeImage(inputPath, outputPath, {
        width: variant.width,
        height: variant.height,
        quality: 85
      });
      results.push({
        size: variant.suffix,
        path: outputPath,
        width: variant.width,
        height: variant.height
      });
    } catch (error) {
      console.error(`Error creating variant ${variant.suffix}:`, error);
    }
  }
  
  return results;
}

/**
 * Get optimized image URL based on device/screen size
 * @param {string} baseUrl - Base URL of the image
 * @param {string} size - Size variant ('thumb', 'medium', 'large')
 */
function getOptimizedImageUrl(baseUrl, size = 'medium') {
  if (!baseUrl) return '';
  
  // If it's already a placeholder or external URL, return as is
  if (baseUrl.includes('via.placeholder.com') || baseUrl.includes('unsplash.com')) {
    return baseUrl;
  }
  
  // Add size suffix to the URL
  const urlParts = baseUrl.split('.');
  if (urlParts.length >= 2) {
    const extension = urlParts.pop();
    const baseName = urlParts.join('.');
    return `${baseName}_${size}.${extension}`;
  }
  
  return baseUrl;
}

module.exports = {
  optimizeImage,
  createImageVariants,
  getOptimizedImageUrl
};
