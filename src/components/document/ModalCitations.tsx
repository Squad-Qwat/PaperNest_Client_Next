import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface ModalAddCitationsProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (cit: { sourceTitle: string, author: string, year: string }) => void;
}

export function ModalAddCitations({ isOpen, onClose, onAdd }: ModalAddCitationsProps) {
    const [newCit, setNewCit] = useState({ sourceTitle: '', author: '', year: '' })

    const handleAdd = () => {
        if (!newCit.sourceTitle || !newCit.author || !newCit.year) return
        onAdd(newCit)
        setNewCit({ sourceTitle: '', author: '', year: '' })
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-6 bg-white rounded-xl border-none shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-gray-800 font-bold">Add New Source</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label>Source Title</Label>
                        <Input 
                            placeholder="e.g.: Twentieth Century Design" 
                            value={newCit.sourceTitle}
                            onChange={e => setNewCit({...newCit, sourceTitle: e.target.value})}
                            className="border-gray-200"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Author</Label>
                            <Input 
                                placeholder="e.g.: Seddon, Tony" 
                                value={newCit.author}
                                onChange={e => setNewCit({...newCit, author: e.target.value})}
                                className="border-gray-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <Input 
                                placeholder="2024" 
                                value={newCit.year}
                                onChange={e => setNewCit({...newCit, year: e.target.value})}
                                className="border-gray-200"
                            />
                        </div>
                    </div>
                    <Button onClick={handleAdd} className="w-full bg-teal-500 hover:bg-teal-600 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Save Source
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}