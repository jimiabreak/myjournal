import fs from 'fs/promises';
import path from 'path';
import { put, del } from '@vercel/blob';

export interface StorageAdapter {
  uploadFile(file: File, fileName: string): Promise<string>;
  deleteFile(fileNameOrUrl: string): Promise<void>;
  getFileUrl(fileName: string): string;
}

// Local file storage adapter
class LocalStorageAdapter implements StorageAdapter {
  private uploadDir = path.join(process.cwd(), 'public', 'userpics');

  async uploadFile(file: File, fileName: string): Promise<string> {
    console.log('Upload attempt:', { fileName, uploadDir: this.uploadDir, cwd: process.cwd() });

    // Ensure upload directory exists
    try {
      await fs.access(this.uploadDir);
    } catch {
      console.log('Creating upload directory:', this.uploadDir);
      await fs.mkdir(this.uploadDir, { recursive: true });
    }

    const filePath = path.join(this.uploadDir, fileName);
    console.log('Writing file to:', filePath);

    const arrayBuffer = await file.arrayBuffer();
    console.log('File size:', arrayBuffer.byteLength);

    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);
    console.log('File written successfully');

    return `/userpics/${fileName}`;
  }

  async deleteFile(fileNameOrUrl: string): Promise<void> {
    // Extract filename from URL if needed (e.g., "/userpics/filename.jpg" -> "filename.jpg")
    const fileName = fileNameOrUrl.includes('/')
      ? fileNameOrUrl.split('/').pop() || fileNameOrUrl
      : fileNameOrUrl;
    const filePath = path.join(this.uploadDir, fileName);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File doesn't exist, ignore error
      console.warn(`File not found for deletion: ${fileName}`);
    }
  }

  getFileUrl(fileName: string): string {
    return `/userpics/${fileName}`;
  }
}

// Vercel Blob storage adapter
class VercelBlobAdapter implements StorageAdapter {
  async uploadFile(file: File, fileName: string): Promise<string> {
    console.log('Vercel Blob upload attempt:', { fileName, fileSize: file.size });

    const blob = await put(`userpics/${fileName}`, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log('Vercel Blob upload success:', blob.url);
    return blob.url;
  }

  async deleteFile(url: string): Promise<void> {
    // Vercel Blob delete requires the full URL
    try {
      await del(url);
      console.log('Vercel Blob delete success:', url);
    } catch (error) {
      console.warn('Vercel Blob delete failed:', url, error);
    }
  }

  getFileUrl(fileName: string): string {
    // For Vercel Blob, the URL is returned from uploadFile
    // This method is only used for local storage compatibility
    return fileName;
  }
}

// Factory function to get the appropriate storage adapter
export function getStorageAdapter(): StorageAdapter {
  const storageType = process.env.STORAGE_TYPE || 'local';

  switch (storageType) {
    case 'vercel-blob':
      return new VercelBlobAdapter();
    case 'local':
    default:
      return new LocalStorageAdapter();
  }
}

// Utility functions for userpic handling
export function generateUserpicFileName(userId: string, originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  return `${userId}-${timestamp}${ext}`;
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const maxSize = 2 * 1024 * 1024; // 2MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and GIF files are allowed' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 2MB' };
  }

  return { valid: true };
}

// Helper to extract old userpic filename from URL for deletion
export function extractUserpicFileName(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/userpics\/(.+)$/);
  return match ? match[1] : null;
}