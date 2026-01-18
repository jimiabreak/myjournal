import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  getStorageAdapter, 
  generateUserpicFileName, 
  validateImageFile,
  extractUserpicFileName
} from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('userpic') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const storage = getStorageAdapter();
    const fileName = generateUserpicFileName(user.id, file.name);

    // Upload the new file
    const newUserpicUrl = await storage.uploadFile(file, fileName);

    // Get current user data to clean up old userpic
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { userpicUrl: true }
    });

    // Delete old userpic if it exists
    if (currentUser?.userpicUrl) {
      const oldFileName = extractUserpicFileName(currentUser.userpicUrl);
      if (oldFileName) {
        try {
          await storage.deleteFile(oldFileName);
        } catch (error) {
          console.warn('Failed to delete old userpic:', error);
        }
      }
    }

    // Update user record with new userpic URL
    await prisma.user.update({
      where: { id: user.id },
      data: { userpicUrl: newUserpicUrl }
    });

    return NextResponse.json({ 
      success: true, 
      userpicUrl: newUserpicUrl 
    });

  } catch (error) {
    console.error('Userpic upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload userpic' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { userpicUrl: true }
    });

    if (currentUser?.userpicUrl) {
      const fileName = extractUserpicFileName(currentUser.userpicUrl);
      if (fileName) {
        const storage = getStorageAdapter();
        try {
          await storage.deleteFile(fileName);
        } catch (error) {
          console.warn('Failed to delete userpic file:', error);
        }
      }
    }

    // Clear userpic URL from database
    await prisma.user.update({
      where: { id: user.id },
      data: { userpicUrl: null }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Userpic deletion error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete userpic' 
    }, { status: 500 });
  }
}