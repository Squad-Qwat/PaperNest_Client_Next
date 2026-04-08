import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Quote, FileInput, ChevronLeft, Pencil } from "lucide-react";

interface Citation {
  id: string;
  sourceTitle: string;
  author: string;
  year: string;
}

type View = 'list' | 'add' | 'edit';

interface CitationsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  // citations: Citation[];
  initialView?: 'list' | 'add'; 
  // onAdd?: (cit: { sourceTitle: string, author: string, year: string }) => void | undefined;
  // onDelete?: (id: string) => void;
  onInsert?: (cit: Citation) => void | undefined;
}

export function CitationsManager({ isOpen, onClose, initialView = 'list' ,onInsert }: CitationsManagerProps) {
    const [citations, setCitations] = useState<Citation[]>([]);
    // const [view, setView] = useState<'list' | 'add'>('qlist');
    const [view, setView] = useState<View>(initialView);
    const [newCit, setNewCit] = useState({ sourceTitle: '', author: '', year: '' });
    const [editingCit, setEditingCit] = useState<Citation | null>(null);

    const handleAdd = () => {
        if (!newCit.sourceTitle || !newCit.author || !newCit.year) return;
        const entry: Citation = {
            ...newCit,
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        setCitations((prev) => [...prev, entry]);
        setNewCit({ sourceTitle: '', author: '', year: '' });
        setView('list'); // Go back to list after adding
    };

    const handleDelete = (id: string) => {
        setCitations((prev) => prev.filter((c) => c.id !== id));
      };
     
      const handleEditOpen = (cit: Citation) => {
        setEditingCit({ ...cit });
        setView('edit');
      };
     
      const handleEditSave = () => {
        if (!editingCit || !editingCit.sourceTitle || !editingCit.author || !editingCit.year) return;
        setCitations((prev) =>
          prev.map((c) => (c.id === editingCit.id ? editingCit : c))
        );
        setEditingCit(null);
        setView('list');
      };

    const handleClose = () => {
        setView('list');
        setNewCit({ sourceTitle: '', author: '', year: '' });
        onClose();
    };

    const titles: Record<View, string> = {
        list: 'Saved Sources',
        add:  'Add New Source',
        edit: 'Edit Source',
      };
     
      const showBack = view !== 'list';

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md p-6 bg-white rounded-xl border-none shadow-lg">
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                    {/* <div className="flex items-center gap-2"> </div> */}
                    {showBack && (
                        <Button size="sm" onClick={() => { setView('list'); setEditingCit(null); }} className="p-1 h-auto"
>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    )}
                    <DialogTitle className={view === 'list'? 
                        'text-gray-500 text-xs font-bold uppercase tracking-widest' : 
                        'text-gray-800 font-bold'}>
                        {
                        /*view === 'list' ? 'Saved Sources' : view === 'edit' ? 'Edit sources' : 'Add new sources'*/
                        titles[view]
                        }
                    </DialogTitle>
                    {view === 'list' && (
                        <Button size="sm" onClick={() => setView('add')} className="bg-teal-500 hover:bg-teal-600">
                            <Plus className="w-4 h-4 mr-1" /> New
                        </Button>
                    )}
                </DialogHeader>

                <div className="mt-4">
                    {view === 'list' && (
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-3">
                                {citations.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 text-sm">No sources found. Add your first one!</div>
                                ) : (
                                    citations.map((cit) => (
                                        <div key={cit.id} className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-transparent hover:border-teal-100 transition-all">
                                            <div className="flex gap-3 items-start">
                                                <div className="mt-1 p-1.5 bg-teal-500/10 rounded-full">
                                                    <Quote className="w-3 h-3 text-teal-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 leading-tight">{cit.sourceTitle}</h4>
                                                    <p className="text-sm text-gray-500 mt-1">{cit.author} • {cit.year}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-teal-600" onClick={() => onInsert?.(cit)}>
                                                    <FileInput className="w-4 h-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-blue-500" title="Edit citation" onClick={() => handleEditOpen(cit)}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-500" onClick={() => handleDelete(cit.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    )}
                    {view === 'add' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Source Title</Label>
                                <Input placeholder="Twentieth Century Design" value={newCit.sourceTitle} onChange={e => setNewCit({...newCit, sourceTitle: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Author</Label>
                                    <Input placeholder="Seddon, Tony" value={newCit.author} onChange={e => setNewCit({...newCit, author: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Year</Label>
                                    <Input placeholder="2024" value={newCit.year} onChange={e => setNewCit({...newCit, year: e.target.value})} />
                                </div>
                            </div>
                            <Button onClick={handleAdd} className="w-full bg-teal-500 hover:bg-teal-600 text-white">
                                Save Source
                            </Button>
                        </div>
                    )}
                    {view === 'edit' && editingCit && (
                            <div className="space-y-4">
                            <div className="space-y-2">
                            <Label>Source Title</Label>
                            <Input
                                placeholder="e.g.: Twentieth Century Design"
                                value={editingCit.sourceTitle}
                                onChange={(e) => setEditingCit({ ...editingCit, sourceTitle: e.target.value })}
                                className="border-gray-200"
                            />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Author</Label>
                                <Input
                                placeholder="e.g.: Seddon, Tony"
                                value={editingCit.author}
                                onChange={(e) => setEditingCit({ ...editingCit, author: e.target.value })}
                                className="border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Year</Label>
                                <Input
                                placeholder="2024"
                                value={editingCit.year}
                                onChange={(e) => setEditingCit({ ...editingCit, year: e.target.value })}
                                className="border-gray-200"
                                />
                            </div>
                            </div>
                            <Button
                            onClick={handleEditSave}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                            >
                            Update Source
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}