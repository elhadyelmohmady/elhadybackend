import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

/**
 * Optimize and resize uploaded image
 * @param {string} filePath - Path to the uploaded image file
 * @param {Object} options - Optimization options
 * @returns {Promise<string>} Path to the optimized image
 */
export const optimizeImage = async (filePath, options = {}) => {
    const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 80,
        format = 'webp'
    } = options;

    try {
        const image = sharp(filePath);
        const metadata = await image.metadata();

        // Resize if image is larger than max dimensions
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
            image.resize(maxWidth, maxHeight, {
                fit: 'inside',
                withoutEnlarging: true
            });
        }

        // Convert to WebP for better compression (or keep original format)
        if (format === 'webp') {
            image.webp({ quality });
        } else if (format === 'jpeg') {
            image.jpeg({ quality });
        } else if (format === 'png') {
            image.png({ quality });
        }

        // Generate new filename with optimized suffix
        const dir = path.dirname(filePath);
        const ext = format === 'webp' ? '.webp' : `.${format}`;
        const optimizedPath = filePath.replace(/\.[^.]+$/, `-optimized${ext}`);

        // Save optimized image
        await image.toFile(optimizedPath);

        // Delete original file if different from optimized
        if (optimizedPath !== filePath) {
            await fs.unlink(filePath);
        }

        return optimizedPath;
    } catch (error) {
        console.error('Error optimizing image:', error);
        throw new Error('Failed to optimize image');
    }
};

/**
 * Get relative path for storing in database
 * @param {string} absolutePath - Absolute file path
 * @returns {string} Relative path
 */
export const getRelativePath = (absolutePath) => {
    const projectRoot = process.cwd();
    return path.relative(projectRoot, absolutePath);
};

/**
 * Delete uploaded file
 * @param {string} filePath - Path to file to delete
 */
export const deleteFile = async (filePath) => {
    try {
        if (filePath && fs) {
            const absolutePath = path.isAbsolute(filePath) 
                ? filePath 
                : path.join(process.cwd(), filePath);
            
            if (await fs.stat(absolutePath).catch(() => false)) {
                await fs.unlink(absolutePath);
            }
        }
    } catch (error) {
        console.error('Error deleting file:', error);
    }
};

/**
 * Process product image upload
 * @param {Express.Multer.File} file - Uploaded file object
 * @returns {Promise<string>} Relative path to processed image
 */
export const processProductImage = async (file) => {
    if (!file) return null;

    try {
        // Optimize the image
        const optimizedPath = await optimizeImage(file.path, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 80,
            format: 'webp'
        });

        // Return relative path
        return getRelativePath(optimizedPath);
    } catch (error) {
        console.error('Error processing product image:', error);
        throw new Error('Failed to process product image');
    }
};

/**
 * Process brand logo upload
 * @param {Express.Multer.File} file - Uploaded file object
 * @returns {Promise<string>} Relative path to processed logo
 */
export const processBrandLogo = async (file) => {
    if (!file) return null;

    try {
        // Optimize the logo (square format for logos)
        const optimizedPath = await optimizeImage(file.path, {
            maxWidth: 500,
            maxHeight: 500,
            quality: 85,
            format: 'webp'
        });

        // Return relative path
        return getRelativePath(optimizedPath);
    } catch (error) {
        console.error('Error processing brand logo:', error);
        throw new Error('Failed to process brand logo');
    }
};
