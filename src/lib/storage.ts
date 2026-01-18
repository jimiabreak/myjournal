import fs from 'fs/promises';
import path from 'path';

export interface StorageAdapter {
  uploadFile(file: File, fileName: string): Promise<string>;
  deleteFile(fileName: string): Promise<void>;
  getFileUrl(fileName: string): string;
}

// Local file storage adapter
class LocalStorageAdapter implements StorageAdapter {
  private uploadDir = path.join(process.cwd(), 'public', 'userpics');

  async uploadFile(file: File, fileName: string): Promise<string> {
    // Ensure upload directory exists
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }

    const filePath = path.join(this.uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    
    return `/userpics/${fileName}`;
  }

  async deleteFile(fileName: string): Promise<void> {
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

// S3 storage adapter (placeholder for future implementation)
class S3StorageAdapter implements StorageAdapter {
  async uploadFile(_file: File, _fileName: string): Promise<string> {
    // TODO: Implement S3 upload
    throw new Error('S3 storage not implemented yet');
  }

  async deleteFile(_fileName: string): Promise<void> {
    // TODO: Implement S3 delete
    throw new Error('S3 storage not implemented yet');
  }

  getFileUrl(_fileName: string): string {
    // TODO: Return S3 URL
    throw new Error('S3 storage not implemented yet');
  }
}

// Factory function to get the appropriate storage adapter
export function getStorageAdapter(): StorageAdapter {
  const storageType = process.env.STORAGE_TYPE || 'local';
  
  switch (storageType) {
    case 's3':
      return new S3StorageAdapter();
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