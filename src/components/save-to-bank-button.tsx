"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, BookmarkCheck, Loader2, Folder, FolderInput } from "lucide-react";
import { saveToQuestionBankAction, moveQuestionsToFolderAction } from "@/actions/question-bank";
import { getFolderTree, createFolder, type FolderWithChildren } from "@/actions/folder";
import { FolderSelectorModal } from "@/components/folder-selector-modal";
import { useRouter } from "next/navigation";

interface SaveToBankButtonProps {
  examId: string;
  questionId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  initialStatus?: QuestionBankStatus;
  questionBankId?: string; // ID in question bank for moving
}

interface QuestionBankStatus {
  inBank: boolean;
  folderName?: string;
  folderId?: string;
}

export function SaveToBankButton({ examId, questionId, variant = "outline", size = "sm", initialStatus, questionBankId }: SaveToBankButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [folders, setFolders] = useState<FolderWithChildren[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [bankStatus, setBankStatus] = useState<QuestionBankStatus>(initialStatus || { inBank: false });
  const [tooltipPosition, setTooltipPosition] = useState<"top" | "bottom">("top");
  const buttonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Update bank status when initialStatus changes (after page refresh)
  useEffect(() => {
    if (initialStatus) {
      setBankStatus(initialStatus);
    }
  }, [initialStatus]);

  // Check if tooltip should appear above or below
  useEffect(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // If button is in top 150px of viewport, show tooltip below
      if (rect.top < 150) {
        setTooltipPosition("bottom");
      } else {
        setTooltipPosition("top");
      }
    }
  }, []);

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
      if (isMoving && questionBankId) {
        // Moving existing question to different folder
        const result = await moveQuestionsToFolderAction([questionBankId], selectedFolderId);
        if (result.success) {
          setShowModal(false);
          router.refresh();
        }
      } else {
        // Saving new question to bank
        const result = await saveToQuestionBankAction(examId, questionId, selectedFolderId);
        
        if (result.alreadyExists) {
          // Already exists, just close
          setShowModal(false);
        } else if (result.success) {
          setShowModal(false);
          setBankStatus({ inBank: true, folderId: selectedFolderId || undefined });
          router.refresh();
        } else {
          alert(result.message);
        }
      }
    } catch (error: any) {
      alert("❌ " + (error.message || isMoving ? "Failed to move question" : "Failed to save question"));
    } finally {
      setIsSaving(false);
      setIsMoving(false);
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
      <div ref={buttonRef} className="relative inline-block">
        <Button
          type="button"
          variant={getButtonVariant()}
          size={size}
          onClick={() => {
            if (bankStatus.inBank) {
              // Already saved - open modal to move to different folder
              setIsMoving(true);
              setSelectedFolderId(bankStatus.folderId || null);
            }
            setShowModal(true);
          }}
          disabled={isSaving}
          className={bankStatus.inBank ? "bg-green-600 hover:bg-green-600/90 text-white" : ""}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : bankStatus.inBank ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <BookmarkPlus className="h-4 w-4" />
          )}
        </Button>
      </div>

      <FolderSelectorModal
        open={showModal}
        onOpenChange={(open) => {
          if (!open) {
            // When closing modal, save or move the question
            if (showModal) {
              handleSave();
            }
          }
          setShowModal(open);
          if (!open) {
            setSelectedFolderId(null);
            setIsMoving(false);
          }
        }}
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onCreateFolder={handleCreateFolder}
        loading={isSaving || loadingFolders}
        title={isMoving ? "Move to Folder" : "Save to Question Bank"}
        description={isMoving ? "Select a folder to move this question" : "Select a folder or save to root"}
      />
    </>
  );
}
