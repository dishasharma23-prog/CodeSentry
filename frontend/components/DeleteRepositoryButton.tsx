"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface Props {
  repositoryId: string;
  repositoryName: string;
  onDeleted: () => void;
}

export default function DeleteRepositoryButton({ repositoryId, repositoryName, onDeleted }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    setError("");
    
    try {
      await api.deleteRepository(repositoryId);
      onDeleted();
    } catch (err: any) {
      setError(err.message || "Failed to delete repository.");
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
    setError("");
  };

  return (
    <div className="flex items-center gap-4">
      {error && <span className="text-cs-critical text-xs">{error}</span>}
      
      {showConfirm ? (
        <div className="flex items-center gap-3">
          <span className="text-xs text-cs-text-secondary max-w-[300px] truncate">
            Delete {repositoryName}, findings, and index data?
          </span>
          <button
            onClick={handleCancel}
            disabled={isDeleting}
            className="text-xs text-cs-text-muted hover:text-white transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs text-cs-critical hover:text-red-400 transition-colors"
          >
            {isDeleting ? "DELETING..." : "CONFIRM"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleDelete}
          className="text-xs text-cs-text-muted hover:text-cs-critical transition-colors opacity-0 group-hover:opacity-100 uppercase tracking-widest"
        >
          DELETE
        </button>
      )}
    </div>
  );
}
