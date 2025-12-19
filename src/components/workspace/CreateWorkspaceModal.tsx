/**
 * Workspace Creation Modal Component
 * Handles creating new workspace via API
 */

'use client';

import { useState } from 'react';
import { workspacesService } from '@/lib/api/services/workspaces.service';
import { apiClient } from '@/lib/api/clients/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { getErrorMessage } from '@/lib/api/utils/error-handler';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const workspaceIcons = ["📚", "🎓", "📖", "✍️", "🔬", "💼", "📊", "🎯", "🌟", "💡"];

export function CreateWorkspaceModal({ isOpen, onClose, onSuccess }: CreateWorkspaceModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📚');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Workspace title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Debug: Check token in localStorage
      const token = localStorage.getItem('accessToken');
      console.log('[CreateWorkspace] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
      
      // Ensure token is set in apiClient before making request
      if (token) {
        apiClient.setAuthToken(token);
        console.log('[CreateWorkspace] Token re-set in apiClient');
      } else {
        throw new Error('No authentication token found. Please login again.');
      }
      
      console.log('[CreateWorkspace] API client headers:', apiClient.getHeaders());
      console.log('[CreateWorkspace] Creating workspace with title:', title);
      
      await workspacesService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        icon: icon,
      });

      console.log('[CreateWorkspace] Workspace created successfully');

      // Reset form
      setTitle('');
      setDescription('');
      setIcon('📚');
      
      // Notify parent
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

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setDescription('');
      setIcon('📚');
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Workspace"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-gray-900 font-normal">
            Workspace Icon
          </Label>
          <div className="grid grid-cols-5 gap-2">
            {workspaceIcons.map((iconOption) => (
              <button
                key={iconOption}
                type="button"
                onClick={() => setIcon(iconOption)}
                className={`p-3 text-2xl border rounded-lg transition-all hover:scale-105 ${
                  icon === iconOption
                    ? "bg-teal-500 border-teal-400"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
                disabled={loading}
              >
                {iconOption}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="workspace-title">
            Workspace Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="workspace-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Research Workspace"
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="workspace-description">
            Description (Optional)
          </Label>
          <Textarea
            id="workspace-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A workspace for my research papers..."
            rows={3}
            disabled={loading}
          />
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Workspace'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
