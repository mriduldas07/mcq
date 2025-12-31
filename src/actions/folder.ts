"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export interface Folder {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  parentId?: string | null;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    questions: number;
    subfolders: number;
  };
}

export interface FolderWithChildren extends Folder {
  subfolders?: FolderWithChildren[];
}

/**
 * Get all folders for the current user in a flat list
 */
export async function getFolders(): Promise<Folder[]> {
  const session = await verifySession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const folders = await prisma.questionFolder.findMany({
    where: {
      teacherId: session.userId,
    },
    include: {
      _count: {
        select: {
          questions: true,
          subfolders: true,
        },
      },
    },
    orderBy: [
      { parentId: 'asc' },
      { name: 'asc' },
    ],
  });

  return folders;
}

/**
 * Get folders organized in a tree structure
 */
export async function getFolderTree(): Promise<FolderWithChildren[]> {
  const session = await verifySession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const folders = await prisma.questionFolder.findMany({
    where: {
      teacherId: session.userId,
    },
    include: {
      _count: {
        select: {
          questions: true,
          subfolders: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Build tree structure
  const folderMap = new Map<string, FolderWithChildren>();
  const rootFolders: FolderWithChildren[] = [];

  // First pass: create map of all folders
  folders.forEach((folder) => {
    folderMap.set(folder.id, { ...folder, subfolders: [] });
  });

  // Second pass: organize into tree
  folders.forEach((folder) => {
    const folderWithChildren = folderMap.get(folder.id)!;
    if (folder.parentId) {
      const parent = folderMap.get(folder.parentId);
      if (parent) {
        parent.subfolders!.push(folderWithChildren);
      } else {
        // Parent not found (shouldn't happen), add to root
        rootFolders.push(folderWithChildren);
      }
    } else {
      rootFolders.push(folderWithChildren);
    }
  });

  return rootFolders;
}

/**
 * Create a new folder
 */
export async function createFolder(data: {
  name: string;
  parentId?: string | null;
  color?: string;
  icon?: string;
}) {
  const session = await verifySession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    throw new Error("Folder name is required");
  }

  // Check for duplicate names in the same location
  const existingFolder = await prisma.questionFolder.findFirst({
    where: {
      teacherId: session.userId,
      name: data.name.trim(),
      parentId: data.parentId || null,
    },
  });

  if (existingFolder) {
    throw new Error("A folder with this name already exists in this location");
  }

  const folder = await prisma.questionFolder.create({
    data: {
      name: data.name.trim(),
      teacherId: session.userId,
      parentId: data.parentId || null,
      color: data.color || null,
      icon: data.icon || null,
    },
    include: {
      _count: {
        select: {
          questions: true,
          subfolders: true,
        },
      },
    },
  });

  revalidatePath("/dashboard/question-bank");
  return folder;
}

/**
 * Update folder details
 */
export async function updateFolder(
  folderId: string,
  data: {
    name?: string;
    color?: string | null;
    icon?: string | null;
  }
) {
  const session = await verifySession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Verify ownership
  const folder = await prisma.questionFolder.findUnique({
    where: { id: folderId },
  });

  if (!folder || folder.teacherId !== session.userId) {
    throw new Error("Folder not found or unauthorized");
  }

  // If updating name, check for duplicates
  if (data.name) {
    const existingFolder = await prisma.questionFolder.findFirst({
      where: {
        teacherId: session.userId,
        name: data.name.trim(),
        parentId: folder.parentId,
        id: { not: folderId },
      },
    });

    if (existingFolder) {
      throw new Error("A folder with this name already exists in this location");
    }
  }

  const updatedFolder = await prisma.questionFolder.update({
    where: { id: folderId },
    data: {
      ...(data.name && { name: data.name.trim() }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.icon !== undefined && { icon: data.icon }),
    },
    include: {
      _count: {
        select: {
          questions: true,
          subfolders: true,
        },
      },
    },
  });

  revalidatePath("/dashboard/question-bank");
  return updatedFolder;
}

/**
 * Delete a folder (moves questions to root)
 */
export async function deleteFolder(folderId: string) {
  const session = await verifySession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Verify ownership
  const folder = await prisma.questionFolder.findUnique({
    where: { id: folderId },
    include: {
      _count: {
        select: {
          questions: true,
          subfolders: true,
        },
      },
    },
  });

  if (!folder || folder.teacherId !== session.userId) {
    throw new Error("Folder not found or unauthorized");
  }

  // Move all questions to null folder (root)
  await prisma.questionBank.updateMany({
    where: { folderId },
    data: { folderId: null },
  });

  // Delete the folder (cascade will handle subfolders)
  await prisma.questionFolder.delete({
    where: { id: folderId },
  });

  revalidatePath("/dashboard/question-bank");
  return { success: true };
}

/**
 * Move a folder to a new parent
 */
export async function moveFolder(folderId: string, newParentId: string | null) {
  const session = await verifySession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Verify ownership
  const folder = await prisma.questionFolder.findUnique({
    where: { id: folderId },
  });

  if (!folder || folder.teacherId !== session.userId) {
    throw new Error("Folder not found or unauthorized");
  }

  // Prevent moving to itself or its descendants
  if (newParentId === folderId) {
    throw new Error("Cannot move folder into itself");
  }

  if (newParentId) {
    const isDescendant = await checkIsDescendant(folderId, newParentId);
    if (isDescendant) {
      throw new Error("Cannot move folder into its own subfolder");
    }
  }

  // Check for duplicate names in new location
  const existingFolder = await prisma.questionFolder.findFirst({
    where: {
      teacherId: session.userId,
      name: folder.name,
      parentId: newParentId,
      id: { not: folderId },
    },
  });

  if (existingFolder) {
    throw new Error("A folder with this name already exists in the destination");
  }

  const updatedFolder = await prisma.questionFolder.update({
    where: { id: folderId },
    data: { parentId: newParentId },
  });

  revalidatePath("/dashboard/question-bank");
  return updatedFolder;
}

/**
 * Helper function to check if targetId is a descendant of folderId
 */
async function checkIsDescendant(
  folderId: string,
  targetId: string
): Promise<boolean> {
  const target = await prisma.questionFolder.findUnique({
    where: { id: targetId },
  });

  if (!target) return false;
  if (target.parentId === folderId) return true;
  if (!target.parentId) return false;

  return checkIsDescendant(folderId, target.parentId);
}

/**
 * Get folder breadcrumb path
 */
export async function getFolderPath(folderId: string | null): Promise<Folder[]> {
  if (!folderId) return [];

  const session = await verifySession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const path: Folder[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const folder = await prisma.questionFolder.findUnique({
      where: { id: currentId },
      include: {
        _count: {
          select: {
            questions: true,
            subfolders: true,
          },
        },
      },
    });

    if (!folder || folder.teacherId !== session.userId) {
      break;
    }

    path.unshift(folder);
    currentId = folder.parentId;
  }

  return path;
}
