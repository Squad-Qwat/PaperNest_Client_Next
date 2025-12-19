/**
 * Workspace Settings Modal Component
 * Handles updating and deleting workspace via API
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { workspacesService } from '@/lib/api/services/workspaces.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { getErrorMessage } from '@/lib/api/utils/error-handler';
import type { Workspace } from '@/lib/api/types/workspace.types';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  onSuccess?: () => void;
}

export function WorkspaceSettingsModal({ 
  isOpen, 
  onClose, 
  workspace,
  onSuccess 
}: WorkspaceSettingsModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState(workspace.title);
  const [description, setDescription] = useState(workspace.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Update form when workspace changes
  useEffect(() => {
    setTitle(workspace.title);
    setDescription(workspace.description || '');
  }, [workspace]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Workspace title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await workspacesService.update(workspace.workspaceId, {
        title: title.trim(),
        description: description.trim() || undefined,
      });

      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      await workspacesService.delete(workspace.workspaceId);
      
      // Redirect to homepage after successful deletion
      router.push('/');
    } catch (err) {
      setError(getErrorMessage(err));
      setShowDeleteDialog(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!loading && !deleting) {
      setTitle(workspace.title);
      setDescription(workspace.description || '');
      setError(null);
      onClose();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Workspace Settings"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-workspace-title">
              Workspace Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-workspace-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Research Workspace"
              disabled={loading || deleting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-workspace-description">
              Description (Optional)
            </Label>
            <Textarea
              id="edit-workspace-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A workspace for my research papers..."
              rows={3}
              disabled={loading || deleting}
            />
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h3>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              disabled={loading || deleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Delete Workspace
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              This action cannot be undone. All documents and data will be permanently deleted.
            </p>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading || deleting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || deleting}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Workspace"
        message={`Are you sure you want to delete "${workspace.title}"? This action cannot be undone and all workspace data will be permanently lost.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
