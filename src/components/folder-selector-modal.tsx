"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderWithChildren } from "@/actions/folder";
import { ChevronRight, ChevronDown, Folder, FolderPlus, FolderOpen, Check } from "lucide-react";

interface FolderSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: FolderWithChildren[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => Promise<void>;
  loading?: boolean;
  title?: string;
  description?: string;
}

export function FolderSelectorModal({
  open,
  onOpenChange,
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  loading = false,
  title = "Select Folder",
  description = "Choose a folder for your question",
}: FolderSelectorModalProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [createError, setCreateError] = useState("");
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setIsCreating(false);
      setNewFolderName("");
      setNewFolderParentId(null);
      setCreateError("");
    }
  }, [open]);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setCreateError("Folder name is required");
      return;
    }

    try {
      setCreateError("");
      await onCreateFolder(newFolderName.trim(), newFolderParentId);
      setIsCreating(false);
      setNewFolderName("");
      setNewFolderParentId(null);
    } catch (error: any) {
      setCreateError(error.message || "Failed to create folder");
    }
  };

  const startCreatingInFolder = (parentId: string | null) => {
    setNewFolderParentId(parentId);
    setIsCreating(true);
    setNewFolderName("");
    setCreateError("");
    
    // Expand parent folder if creating inside it
    if (parentId) {
      setExpandedFolders(prev => new Set([...prev, parentId]));
    }
  };

  const renderFolder = (folder: FolderWithChildren, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const hasSubfolders = folder.subfolders && folder.subfolders.length > 0;
    const isHovered = hoveredFolder === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer
            transition-colors group
            ${isSelected ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100" : "hover:bg-gray-100 dark:hover:bg-gray-800"}
          `}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onMouseEnter={() => setHoveredFolder(folder.id)}
          onMouseLeave={() => setHoveredFolder(null)}
        >
          {/* Expand/Collapse Icon */}
          {hasSubfolders && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="shrink-0 w-5 h-5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasSubfolders && <div className="w-5" />}

          {/* Folder Icon */}
          <div className="shrink-0">
            {folder.icon ? (
              <span className="text-lg">{folder.icon}</span>
            ) : isExpanded ? (
              <FolderOpen className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
            ) : (
              <Folder className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
            )}
          </div>

          {/* Folder Name */}
          <button
            onClick={() => onSelectFolder(folder.id)}
            className="flex-1 text-left font-medium truncate"
          >
            {folder.name}
          </button>

          {/* Question Count */}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {folder._count?.questions || 0}
          </span>

          {/* Selected Check */}
          {isSelected && (
            <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          )}

          {/* Create Subfolder Button (on hover) */}
          {isHovered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startCreatingInFolder(folder.id);
              }}
              className="shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Create subfolder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Render Subfolders */}
        {isExpanded && hasSubfolders && (
          <div>
            {folder.subfolders!.map((subfolder) =>
              renderFolder(subfolder, level + 1)
            )}
          </div>
        )}

        {/* Show create form if creating in this folder */}
        {isCreating && newFolderParentId === folder.id && isExpanded && (
          <div
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 mt-1"
            style={{ marginLeft: `${(level + 1) * 20 + 12}px` }}
          >
            <FolderPlus className="w-5 h-5 text-gray-400" />
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name"
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") setIsCreating(false);
              }}
            />
            <Button size="sm" onClick={handleCreateFolder}>
              Create
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1 border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          {/* Root Option */}
          <div
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer
              transition-colors
              ${selectedFolderId === null ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100" : "hover:bg-gray-100 dark:hover:bg-gray-800"}
            `}
            onClick={() => onSelectFolder(null)}
          >
            <FolderOpen className="w-5 h-5 text-gray-500" />
            <span className="flex-1 font-medium">📁 Root (No folder)</span>
            {selectedFolderId === null && (
              <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>

          {/* Show create form for root level */}
          {isCreating && newFolderParentId === null && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
              <FolderPlus className="w-5 h-5 text-gray-400" />
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name"
                className="flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") setIsCreating(false);
                }}
              />
              <Button size="sm" onClick={handleCreateFolder}>
                Create
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          )}

          {createError && (
            <div className="text-sm text-red-600 dark:text-red-400 px-3 py-1">
              {createError}
            </div>
          )}

          {/* Folder Tree */}
          {folders.length === 0 && !isCreating && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No folders yet</p>
              <p className="text-sm">Create your first folder to get started</p>
            </div>
          )}

          {folders.map((folder) => renderFolder(folder, 0))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => startCreatingInFolder(null)}
            disabled={isCreating}
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Don't close modal here - parent will close it after successful save
                onOpenChange(false);
              }} 
              disabled={loading}
            >
              {loading ? "Saving..." : "Save to Selected Folder"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
