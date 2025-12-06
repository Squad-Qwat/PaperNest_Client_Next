import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Quote } from "lucide-react";

interface Citation {
  id: string;
  sourceTitle: string;
  author: string;
  year: string;
  color: string;
}

interface ModalCitationsProps {
  isOpen: boolean;
  onClose: () => void;
  citations: Citation[];
  onAdd: (cit: Omit<Citation, 'id'>) => void;
}

export function ModalAddCitations({ isOpen, onClose, onAdd }: ModalCitationsProps) {
    const [newCit, setNewCit] = useState({ sourceTitle: '', author: '', year: '', color: '' })

    const handleAdd = () => {
        if (!newCit.author || !newCit.year) return
        onAdd(newCit)
        setNewCit({ sourceTitle: '', author: '', year: '', color: '' })
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-6 bg-white rounded-xl border-none shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Add New Source</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="space-y-3">
                        <Input 
                            placeholder="Source Title (e.g., The Future of AI)" 
                            value={newCit.sourceTitle}
                            onChange={e => setNewCit({...newCit, sourceTitle: e.target.value})}
                            className="border-2 border-teal-100 focus-visible:ring-teal-400"
                        />
                        <div className="flex gap-3">
                            <div className="flex-1 space-y-3">
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Author (Last Name)" 
                                        value={newCit.author}
                                        onChange={e => setNewCit({...newCit, author: e.target.value})}
                                    />
                                    <Input 
                                        placeholder="Year" 
                                        className="w-66"
                                        value={newCit.year}
                                        onChange={e => setNewCit({...newCit, year: e.target.value})}
                                    />
                                </div>
                                <Input 
                                    placeholder="Color (e.g., bg-red-500)" 
                                    value={newCit.color}
                                    onChange={e => setNewCit({...newCit, color: e.target.value})}
                                />
                            </div>
                        </div>
                        <Button 
                                onClick={handleAdd} 
                                className="h-auto px-4 bg-teal-500 hover:bg-teal-600 text-white flex flex-col justify-center"
                            >
                                <Plus className="w-6 h-6" />
                            </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}