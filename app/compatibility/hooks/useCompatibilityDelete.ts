"use client";

import { useState, useCallback } from "react";

interface UseCompatibilityDeleteReturn {
  deleteTargetId: string | null;
  isDeleting: boolean;
  handleDeleteClick: (pairId: string) => void;
  handleDeleteCancel: () => void;
  handleDeleteConfirm: () => Promise<boolean>;
}

export const useCompatibilityDelete = (
  onDeleteSuccess: (pairId: string) => void
): UseCompatibilityDeleteReturn => {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = useCallback((pairId: string) => {
    setDeleteTargetId(pairId);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTargetId(null);
  }, []);

  const handleDeleteConfirm = useCallback(async (): Promise<boolean> => {
    if (!deleteTargetId) return false;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/compatibility/${deleteTargetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete compatibility pair");
      }

      onDeleteSuccess(deleteTargetId);
      setDeleteTargetId(null);
      return true;
    } catch {
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTargetId, onDeleteSuccess]);

  return {
    deleteTargetId,
    isDeleting,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
  };
};
