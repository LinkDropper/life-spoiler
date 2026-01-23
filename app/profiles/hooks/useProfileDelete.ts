"use client";

import { useState, useCallback } from "react";

import { useProfileActions } from "@/libs/stores/profile";

interface UseProfileDeleteReturn {
  deleteTargetId: string | null;
  isDeleting: boolean;
  handleDeleteClick: (profileId: string) => void;
  handleDeleteCancel: () => void;
  handleDeleteConfirm: () => Promise<boolean>;
}

export const useProfileDelete = (): UseProfileDeleteReturn => {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteProfile: deleteProfileFromStore } = useProfileActions();

  const handleDeleteClick = useCallback((profileId: string) => {
    setDeleteTargetId(profileId);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTargetId(null);
  }, []);

  const handleDeleteConfirm = useCallback(async (): Promise<boolean> => {
    if (!deleteTargetId) return false;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/profile/${deleteTargetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete profile");
      }

      deleteProfileFromStore(deleteTargetId);
      setDeleteTargetId(null);
      return true;
    } catch {
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTargetId, deleteProfileFromStore]);

  return {
    deleteTargetId,
    isDeleting,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
  };
};
