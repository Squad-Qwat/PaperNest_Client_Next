import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Quote, FileInput, ChevronLeft, Pencil } from "lucide-react";

// Types
export type CitationType =
  | 'article'       // Journal Article
  | 'conference'    // Conference Paper
  | 'thesis'        // Professor's Doctoral Thesis
  | 'discrete'      // Magister's Discrete
  | 'script'        // Fresh Graduate's Script
  | 'book'          // Book
  | 'website';      // Website
  // | 'report'
  // | 'blog'

// Citation in itself
export interface Citation {
  id: string;
  index: number;           // auto-managed sequential index
  type: CitationType;
  sourceTitle: string;
  authors: string[];       // multiple authors
  year: string;
  bookTitle?: string;      // journal name / conference book / web name / publisher
  volume?: string;         // article only
  numbers?: string;        // article only
  pagesFrom?: string;      // start page
  pagesTo?: string;        // end page
  location?: string;       // conference / script
  institution?: string;    // thesis / discrete / script
  publicationNumber?: string; // thesis (optional)
  url?: string;
  doi?: string;
}

type View = 'list' | 'add' | 'edit';

// Field visibility per type
interface FieldVisibility 
{
  bookTitle: boolean;     // doubles as journal / publisher / web name label
  bookTitleLabel: string;
  volume: boolean;
  numbers: boolean;
  pages: boolean;
  location: boolean;
  institution: boolean;
  publicationNumber: boolean;
  url: boolean;
  doi: boolean;
}

function getFields(type: CitationType): FieldVisibility 
{
  switch (type) 
  {
    case 'article':
      return { bookTitle: true,  bookTitleLabel: 'Journal Title', volume: true,  numbers: true,  pages: true,  location: false, institution: false, publicationNumber: false, url: true,  doi: true  };
    case 'conference':
      return { bookTitle: true,  bookTitleLabel: 'Book Title',    volume: false, numbers: false, pages: true,  location: true,  institution: false, publicationNumber: false, url: true,  doi: true  };
    case 'thesis':
      return { bookTitle: false, bookTitleLabel: '',              volume: false, numbers: false, pages: false, location: false, institution: true,  publicationNumber: true,  url: true,  doi: true  };
    case 'discrete':
      return { bookTitle: false, bookTitleLabel: '',              volume: false, numbers: false, pages: false, location: false, institution: true,  publicationNumber: false, url: true,  doi: true  };
    case 'script':
      return { bookTitle: false, bookTitleLabel: '',              volume: false, numbers: false, pages: false, location: true,  institution: true,  publicationNumber: false, url: true,  doi: true  };
    case 'book':
      return { bookTitle: true,  bookTitleLabel: 'Publisher',     volume: false, numbers: false, pages: false, location: false, institution: false, publicationNumber: false, url: true,  doi: true  };
    case 'website':
      return { bookTitle: true,  bookTitleLabel: 'Website Name',  volume: false, numbers: false, pages: false, location: false, institution: false, publicationNumber: false, url: true,  doi: false };
    /* 
        case 'report':
        case 'blog':
        return { bookTitle: true,  bookTitleLabel: 'Publication / Platform', volume: false, numbers: false, pages: false, location: false, institution: false, publicationNumber: false, url: true, doi: true }; 
    */
    default:
      return { bookTitle: false, bookTitleLabel: '', volume: false, numbers: false, pages: false, location: false, institution: false, publicationNumber: false, url: true, doi: true };
  }
}

// Empty form state 
const emptyCit = (): Omit<Citation, 'id' | 'index'> => ({
  type: 'article',
  sourceTitle: '',
  authors: [''],
  year: '',
  bookTitle: '',
  volume: '',
  numbers: '',
  pagesFrom: '',
  pagesTo: '',
  location: '',
  institution: '',
  publicationNumber: '',
  url: '',
  doi: '',
});

// Shared form fields component
export interface FormData extends Omit<Citation, 'id' | 'index'> {}

interface CitationFormProps 
{
  data: FormData;
  onChange: (updated: FormData) => void;
}

// Helper components
function CitationForm({ data, onChange }: CitationFormProps) 
{
  const fields = getFields(data.type);

  const set = (patch: Partial<FormData>) => onChange({ ...data, ...patch });

  // Author helpers
  const setAuthor = (i: number, val: string) => {
    const next = [...data.authors];
    next[i] = val;
    set({ authors: next });
  };
  const addAuthor = () => set({ authors: [...data.authors, ''] });
  const removeAuthor = (i: number) => {
    if (data.authors.length === 1) return;
    set({ authors: data.authors.filter((_, idx) => idx !== i) });
  };

  const inputCls = "border-gray-200 focus:border-teal-400 focus:ring-teal-400/20 text-sm";

  return (
    <ScrollArea className="h-[420px] pr-3">
      <div className="space-y-4 pb-2">

        {/* Source Title */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Source Title</Label>
          <Input
            className={inputCls}
            placeholder="e.g. Twentieth Century Design"
            value={data.sourceTitle}
            onChange={e => set({ sourceTitle: e.target.value })}
          />
        </div>

        {/* Authors — dynamic list */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Author(s)</Label>
            <button
              type="button"
              onClick={addAuthor}
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              <Plus className="w-3 h-3" /> Add author
            </button>
          </div>
          <div className="space-y-2">
            {data.authors.map((author, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  className={inputCls + " flex-1"}
                  placeholder={`Author ${i + 1} (e.g. Seddon, Tony)`}
                  value={author}
                  onChange={e => setAuthor(i, e.target.value)}
                />
                {data.authors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAuthor(i)}
                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                    title="Remove author"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Year + Type */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Year</Label>
            <Input
              className={inputCls}
              placeholder="2024"
              value={data.year}
              onChange={e => set({ year: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</Label>
            <select
              className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
              value={data.type}
              onChange={e => set({ type: e.target.value as CitationType })}
            >
              <optgroup label="Scientific">
                <option value="article">Journal Article</option>
                <option value="conference">Conference Paper</option>
                <option value="thesis">Professor's Doctoral Thesis</option>
                <option value="discrete">Magister's Discrete</option>
                <option value="script">Fresh Graduate's Script</option>
              </optgroup>
              <optgroup label="General">
                <option value="book">Book</option>
                <option value="website">Website</option>
                {/* <option value="report">News Report</option>
                <option value="blog">Blog</option> */}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Book Title / Journal / Publisher / Web Name */}
        {fields.bookTitle && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {fields.bookTitleLabel}
            </Label>
            <Input
              className={inputCls}
              placeholder={`e.g. ${fields.bookTitleLabel}`}
              value={data.bookTitle ?? ''}
              onChange={e => set({ bookTitle: e.target.value })}
            />
          </div>
        )}

        {/* Volume + Numbers (article only) */}
        {(fields.volume || fields.numbers) && (
          <div className="grid grid-cols-2 gap-3">
            {fields.volume && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Volume</Label>
                <Input
                  className={inputCls}
                  placeholder="e.g. 36"
                  value={data.volume ?? ''}
                  onChange={e => set({ volume: e.target.value })}
                />
              </div>
            )}
            {fields.numbers && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Number</Label>
                <Input
                  className={inputCls}
                  placeholder="e.g. 1"
                  value={data.numbers ?? ''}
                  onChange={e => set({ numbers: e.target.value })}
                />
              </div>
            )}
          </div>
        )}

        {/* Pages — from / to */}
        {fields.pages && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pages</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                className={inputCls}
                placeholder="From (e.g. 22)"
                value={data.pagesFrom ?? ''}
                onChange={e => set({ pagesFrom: e.target.value })}
              />
              <Input
                className={inputCls}
                placeholder="To (e.g. 45)"
                value={data.pagesTo ?? ''}
                onChange={e => set({ pagesTo: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Location (conference, script) */}
        {fields.location && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Location</Label>
            <Input
              className={inputCls}
              placeholder="e.g. Bandung, Indonesia"
              value={data.location ?? ''}
              onChange={e => set({ location: e.target.value })}
            />
          </div>
        )}

        {/* Institution (thesis, discrete, script) */}
        {fields.institution && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Institution Name</Label>
            <Input
              className={inputCls}
              placeholder="e.g. Institut Teknologi Bandung"
              value={data.institution ?? ''}
              onChange={e => set({ institution: e.target.value })}
            />
          </div>
        )}

        {/* Publication Number (thesis, optional) */}
        {fields.publicationNumber && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Publication Number <span className="text-gray-400 normal-case font-normal">(optional)</span>
            </Label>
            <Input
              className={inputCls}
              placeholder="e.g. 12345"
              value={data.publicationNumber ?? ''}
              onChange={e => set({ publicationNumber: e.target.value })}
            />
          </div>
        )}

        {/* URL + DOI */}
        {(fields.url || fields.doi) && (
          <div className={fields.url && fields.doi ? "grid grid-cols-2 gap-3" : "space-y-1.5"}>
            {fields.url && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">URL</Label>
                <Input
                  className={inputCls}
                  placeholder="https://... or -"
                  value={data.url ?? ''}
                  onChange={e => set({ url: e.target.value })}
                />
              </div>
            )}
            {fields.doi && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">DOI</Label>
                <Input
                  className={inputCls}
                  placeholder="10.xxxx/... or -"
                  value={data.doi ?? ''}
                  onChange={e => set({ doi: e.target.value })}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// Shared content (used by both modal and inline variants)

interface CitationsManagerContentProps {
  view: View;
  setView: (v: View) => void;
  citations: Citation[];
  newCit: FormData;
  setNewCit: (d: FormData) => void;
  editingCit: Citation | null;
  setEditingCit: (c: Citation | null) => void;
  handleAdd: () => void;
  handleDelete: (id: string) => void;
  handleEditOpen: (cit: Citation) => void;
  handleEditSave: () => void;
  onInsert?: (cit: Citation) => void;
  // inline mode: hides the Dialog chrome titles (handled by the page itself)
  inline?: boolean;
}

function CitationsManagerContent({
  view, 
  setView,
  citations,
  newCit, 
  setNewCit,
  editingCit, 
  setEditingCit,
  handleAdd, 
  handleDelete, 
  handleEditOpen, 
  handleEditSave,
  onInsert,
  inline = false,
}: CitationsManagerContentProps) {
  const titles: Record<View, string> = {
    list: 'Saved Sources',
    add: 'Add New Source',
    edit: 'Edit Source',
  };
 
  const showBack = view !== 'list';
 
  return (
    <div className={inline ? 'bg-white rounded-xl shadow-sm border border-gray-100 p-6' : ''}>
      {/* Header */}
      <div className="flex flex-row items-center justify-between border-b pb-4 mb-4">
        {showBack ? (
          <Button size="sm" variant="ghost" onClick={() => { setView('list'); setEditingCit(null); }} className="p-1 h-auto">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        ) : <div />}
 
        <span className={view === 'list'
          ? 'text-gray-500 text-xs font-bold uppercase tracking-widest'
          : 'text-gray-800 font-bold text-sm'}>
          {titles[view]}
        </span>
 
        {view === 'list' ? (
          <Button size="sm" onClick={() => setView('add')} className="bg-teal-500 hover:bg-teal-600">
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        ) : <div />}
      </div>
 
      {/* List view */}
      {view === 'list' && (
        <ScrollArea className="h-[420px] pr-4">
          <div className="space-y-3">
            {citations.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No sources yet. Add your first one!</div>
            ) : (
              citations.map(cit => (
                <div key={cit.id} className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-transparent hover:border-teal-100 transition-all">
                  <div className="flex gap-3 items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-teal-600">{cit.index}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 leading-tight text-sm">{cit.sourceTitle}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{cit.authors.filter(Boolean).join('; ')} • {cit.year}</p>
                      <p className="text-xs text-teal-600/70 mt-0.5 capitalize">{cit.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-teal-600" title="Insert into document" onClick={() => onInsert?.(cit)}>
                      <FileInput className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-blue-500" title="Edit citation" onClick={() => handleEditOpen(cit)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-500" title="Delete citation" onClick={() => handleDelete(cit.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      )}
 
      {/* Add view */}
      {view === 'add' && (
        <div className="space-y-4">
          <CitationForm data={newCit} onChange={setNewCit} />
          <Button onClick={handleAdd} className="w-full bg-teal-500 hover:bg-teal-600 text-white">Save Source</Button>
        </div>
      )}
 
      {/* Edit view */}
      {view === 'edit' && editingCit && (
        <div className="space-y-4">
          <CitationForm data={editingCit} onChange={updated => setEditingCit({ ...editingCit, ...updated })} />
          <Button onClick={handleEditSave} className="w-full bg-blue-500 hover:bg-blue-600 text-white">Update Source</Button>
        </div>
      )}
    </div>
  );
}

// Shared logic hook

function useCitationsManagerLogic(
  citations: Citation[],
  onCitationsChange: (c: Citation[]) => void,
  isOpen: boolean,
  initialView: View,
) {
  const [view, setView] = useState<View>(initialView);
  const [newCit, setNewCit] = useState<FormData>(emptyCit());
  const [editingCit, setEditingCit] = useState<Citation | null>(null);
 
  React.useEffect(() => {
    if (isOpen) setView('list');
  }, [isOpen]);
 
  const reindex = (list: Citation[]): Citation[] => list.map((c, i) => ({ ...c, index: i + 1 }));
 
  const handleAdd = () => {
    if (!newCit.sourceTitle.trim() || !newCit.authors[0].trim() || !newCit.year.trim()) return;
    const entry: Citation = {
      ...newCit,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      index: citations.length + 1,
    };
    onCitationsChange(reindex([...citations, entry]));
    setNewCit(emptyCit());
    setView('list');
  };
 
  const handleDelete = (id: string) => onCitationsChange(reindex(citations.filter(c => c.id !== id)));
 
  const handleEditOpen = (cit: Citation) => { setEditingCit({ ...cit }); setView('edit'); };
 
  const handleEditSave = () => {
    if (!editingCit || !editingCit.sourceTitle.trim() || !editingCit.authors[0].trim() || !editingCit.year.trim()) return;
    onCitationsChange(reindex(citations.map(c => (c.id === editingCit.id ? editingCit : c))));
    setEditingCit(null);
    setView('list');
  };
 
  const handleClose = (onClose: () => void) => {
    setNewCit(emptyCit());
    setEditingCit(null);
    onClose();
  };
 
  return { view, setView, newCit, setNewCit, editingCit, setEditingCit, handleAdd, handleDelete, handleEditOpen, handleEditSave, handleClose };
}

// Props
interface CitationsManagerProps 
{
  isOpen: boolean;
  onClose: () => void;
  citations: Citation[];
  onCitationsChange: (citations: Citation[]) => void;
  initialView?: 'list' | 'add';
  // onAdd?: (cit: { sourceTitle: string, author: string, year: string }) => void | undefined;
  // onDelete?: (id: string) => void;
  onInsert?: (cit: Citation) => void;
  inline?: boolean;
}

// Main Component
export function CitationsManager({
  isOpen,
  onClose,
  citations,
  onCitationsChange,
  initialView = 'list',
  onInsert,
  inline = false,
}: CitationsManagerProps) {
  const logic = useCitationsManagerLogic(citations, onCitationsChange, isOpen, initialView);
 
  const content = (
    <CitationsManagerContent
      {...logic}
      citations={citations}
      onInsert={onInsert}
      inline={inline}
    />
  );
 
  // Inline mode: no Dialog wrapper — used by the dedicated /citations page
  if (inline) return content;
 
  // Modal mode: wrapped in Dialog — used by DocumentHeader / EditorToolbar
  return (
    <Dialog open={isOpen} onOpenChange={() => logic.handleClose(onClose)}>
      <DialogContent className="max-w-md p-6 bg-white rounded-xl border-none shadow-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Citations Manager</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

/* Legacy: 
  export function CitationsManager({ isOpen, onClose, citations, onCitationsChange, initialView = 'list', onInsert, inline = false }: CitationsManagerProps) 
  {
    -> const [citations, setCitations] = useState<Citation[]>([]);
    const [view, setView] = useState<View>(initialView);
    const [newCit, setNewCit] = useState<FormData>(emptyCit());
    const [editingCit, setEditingCit] = useState<Citation | null>(null);

    -> Reset to list view whenever the modal opens
    React.useEffect(() => {
      if (isOpen) setView('list');
    }, [isOpen]);

    -> Rebuild sequential 1-based indices after any mutation
    const reindex = (list: Citation[]): Citation[] =>
      list.map((c, i) => ({ ...c, index: i + 1 }));

    const handleAdd = () => {
      if (!newCit.sourceTitle.trim() || !newCit.authors[0].trim() || !newCit.year.trim()) return;
      const entry: Citation = {
        ...newCit,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        index: citations.length + 1,
      };
      -> setCitations(prev => reindex([...prev, entry]));
      onCitationsChange(reindex([...citations, entry]));
      setNewCit(emptyCit());
      setView('list');
    };

    const handleDelete = (id: string) => {
      -> setCitations(prev => reindex(prev.filter(c => c.id !== id)));
      onCitationsChange(reindex(citations.filter(c => c.id !== id)));
    };

    const handleEditOpen = (cit: Citation) => {
      setEditingCit({ ...cit });
      setView('edit');
    };

    const handleEditSave = () => {
      if (!editingCit || !editingCit.sourceTitle.trim() || !editingCit.authors[0].trim() || !editingCit.year.trim()) return;
      -> setCitations(prev => reindex(prev.map(c => (c.id === editingCit.id ? editingCit : c))));
      onCitationsChange(reindex(citations.map(c => (c.id === editingCit.id ? editingCit : c))));
      setEditingCit(null);
      setView('list');
    };

    const handleClose = () => {
      setView('list');
      setNewCit(emptyCit());
      setEditingCit(null);
      onClose();
    };

    const titles: Record<View, string> = {
      list: 'Saved Sources',
      add: 'Add New Source',
      edit: 'Edit Source',
    };

    const showBack = view !== 'list';

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md p-6 bg-white rounded-xl border-none shadow-lg">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-4 mb-2">
            {showBack && (
              <Button
                size="sm"
                onClick={() => { setView('list'); setEditingCit(null); }}
                className="p-1 h-auto"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className={view === 'list'
              ? 'text-gray-500 text-xs font-bold uppercase tracking-widest'
              : 'text-gray-800 font-bold'}>
              {titles[view]}
            </DialogTitle>
            {view === 'list' && (
              <Button size="sm" onClick={() => setView('add')} className="bg-teal-500 hover:bg-teal-600">
                <Plus className="w-4 h-4 mr-1" /> New
              </Button>
            )}
          </DialogHeader>

          <div className="mt-2">
            {-> ── LIST VIEW ── }
            {view === 'list' && (
              <ScrollArea className="h-[420px] pr-4">
                <div className="space-y-3">
                  {citations.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                      No sources yet. Add your first one!
                    </div>
                  ) : (
                    citations.map(cit => (
                      <div
                        key={cit.id}
                        className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-transparent hover:border-teal-100 transition-all"
                      >
                        <div className="flex gap-3 items-start">
                          {-> Index badge }
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/10 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-teal-600">{cit.index}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 leading-tight text-sm">{cit.sourceTitle}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {cit.authors.filter(Boolean).join('; ')} • {cit.year}
                            </p>
                            <p className="text-xs text-teal-600/70 mt-0.5 capitalize">{cit.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-teal-600" title="Insert into document" onClick={() => onInsert?.(cit)}>
                            <FileInput className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-blue-500" title="Edit citation" onClick={() => handleEditOpen(cit)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-500" title="Delete citation" onClick={() => handleDelete(cit.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}

            {-> ── ADD VIEW ── }
            {view === 'add' && (
              <div className="space-y-4">
                <CitationForm data={newCit} onChange={setNewCit} />
                <Button onClick={handleAdd} className="w-full bg-teal-500 hover:bg-teal-600 text-white">
                  Save Source
                </Button>
              </div>
            )}

            {-> ── EDIT VIEW ── }
            {view === 'edit' && editingCit && (
              <div className="space-y-4">
                <CitationForm
                  data={editingCit}
                  onChange={updated => setEditingCit({ ...editingCit, ...updated })}
                />
                <Button onClick={handleEditSave} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  Update Source
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  } 
*/