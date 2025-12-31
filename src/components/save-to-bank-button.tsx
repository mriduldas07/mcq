"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, BookmarkCheck, Loader2, Folder } from "lucide-react";
import { saveToQuestionBankAction } from "@/actions/question-bank";
import { getFolderTree, createFolder, type FolderWithChildren } from "@/actions/folder";
import { FolderSelectorModal } from "@/components/folder-selector-modal";
import { useRouter } from "next/navigation";

interface SaveToBankButtonProps {
  examId: string;
  questionId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  initialStatus?: QuestionBankStatus;
}

interface QuestionBankStatus {
  inBank: boolean;
  folderName?: string;
  folderId?: string;
}

export function SaveToBankButton({ examId, questionId, variant = "outline", size = "sm", initialStatus }: SaveToBankButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [folders, setFolders] = useState<FolderWithChildren[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [bankStatus, setBankStatus] = useState<QuestionBankStatus>(initialStatus || { inBank: false });
  const router = useRouter();

  const loadFolders = useCallback(async () => {
    setLoadingFolders(true);
    try {
      const folderTree = await getFolderTree();
      setFolders(folderTree);
    } catch (error) {
      console.error("Failed to load folders:", error);
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  // Load folders when modal opens
  useEffect(() => {
    if (showModal) {
      loadFolders();
    }
  }, [showModal, loadFolders]);

  const handleCreateFolder = async (name: string, parentId: string | null) => {
    try {
      await createFolder({ name, parentId });
      await loadFolders(); // Reload folders after creating
    } catch (error: any) {
      throw new Error(error.message || "Failed to create folder");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveToQuestionBankAction(examId, questionId, selectedFolderId);
      
      if (result.alreadyExists) {
        // Question already in bank - show info message
        alert("ℹ️ " + result.message);
      } else if (result.success) {
        // Successfully saved - show success message
        alert("✅ " + result.message);
        setShowModal(false);
        // Update local state to reflect the change
        setBankStatus({ inBank: true, folderId: selectedFolderId || undefined });
      } else {
        // Some other issue
        alert(result.message);
      }
    } catch (error: any) {
      alert("❌ " + (error.message || "Failed to save question"));
    } finally {
      setIsSaving(false);
    }
  };

  const getButtonVariant = () => {
    if (bankStatus.inBank) {
      return "default"; // Filled style for questions already in bank
    }
    return variant;
  };

  return (
    <>
      <div className="relative group inline-block">
        <Button
          type="button"
          variant={getButtonVariant()}
          size={size}
          onClick={() => {
            if (!bankStatus.inBank) {
              setShowModal(true);
            }
          }}
          disabled={isSaving || bankStatus.inBank}
          className={bankStatus.inBank ? "bg-green-600 hover:bg-green-600 text-white cursor-not-allowed opacity-80" : ""}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : bankStatus.inBank ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <BookmarkPlus className="h-4 w-4" />
          )}
        </Button>
        
        {/* Custom Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
          <div className="flex flex-col gap-1">
            <p className="font-semibold">
              {bankStatus.inBank ? "Already in Question Bank" : "Save to Question Bank"}
            </p>
            {bankStatus.inBank && bankStatus.folderName && (
              <div className="flex items-center gap-1 text-xs text-gray-300">
                <Folder className="h-3 w-3" />
                <span>Folder: {bankStatus.folderName}</span>
              </div>
            )}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>

      <FolderSelectorModal
        open={showModal}
        onOpenChange={(open) => {
          if (!open) {
            // When closing modal, save the question
            if (showModal) {
              handleSave();
            }
          }
          setShowModal(open);
          if (!open) {
            setSelectedFolderId(null); // Reset selection when closing
          }
        }}
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onCreateFolder={handleCreateFolder}
        loading={isSaving || loadingFolders}
      />
    </>
  );
}
