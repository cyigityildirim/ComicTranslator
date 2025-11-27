import JSZip from 'jszip';
import { ComicPage } from '../types';

// Store zip instance in memory so we don't have to reload for every page
// In a real production app with React Router, this might be in a Context
let currentZip: JSZip | null = null;

export const loadArchive = async (file: File): Promise<ComicPage[]> => {
  try {
    const zip = new JSZip();
    // Load the zip file efficiently
    const loadedZip = await zip.loadAsync(file);
    currentZip = loadedZip;

    // Filter for images and sort them
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const files: string[] = [];

    loadedZip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        const lowerName = relativePath.toLowerCase();
        if (imageExtensions.some(ext => lowerName.endsWith(ext))) {
          // Ignore __MACOSX and hidden files
          if (!lowerName.includes('__macosx') && !lowerName.startsWith('.')) {
             files.push(relativePath);
          }
        }
      }
    });

    // Sort files naturally (e.g. page1, page2, page10)
    files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    return files.map((fileName, index) => ({
      fileName,
      index
    }));
  } catch (error) {
    console.error("Failed to load archive", error);
    throw new Error("Could not parse the comic archive. Ensure it is a valid .cbz or .zip file.");
  }
};

export const getPageImage = async (fileName: string): Promise<string> => {
  if (!currentZip) {
    throw new Error("No archive loaded");
  }

  const file = currentZip.file(fileName);
  if (!file) {
    throw new Error(`Page ${fileName} not found in archive`);
  }

  // Return base64 for display
  const base64 = await file.async('base64');
  // Detect mime type roughly from extension
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  let mime = 'image/jpeg';
  if (ext === 'png') mime = 'image/png';
  if (ext === 'webp') mime = 'image/webp';
  
  return `data:${mime};base64,${base64}`;
};

export const clearArchive = () => {
  currentZip = null;
};
