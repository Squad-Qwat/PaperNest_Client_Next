import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, FileInput, Quote } from 'lucide-react'

interface Citation {
    id: string;
    sourceTitle: string;
    author: string;
    year: string;
}

interface ModalListCitationsProps {
    isOpen: boolean;
    onClose: () => void;
    citations: Citation[];
    onDelete: (id: string) => void;
    onInsert: (cit: Citation) => void;
}

const MOCK_CITATIONS: Citation[] = [
	{
		id: '1',
		sourceTitle: 'Twentieth Century Design',
		author: 'Seddon, Tony',
        year: '2014',
	},
	{
		id: '2',
		sourceTitle: '500 Resep Masakan Terfavorit',
		author: 'Soewitomo, Sisca',
        year: '2011',
	},
	{
		id: '3',
		sourceTitle: 'Sebuah Seni untuk Bersikap Bodo Amat',
		author: 'Manson, Mark',
        year: '2016',
	},
	{
		id: '4',
		sourceTitle: 'Internet Offline, Solusi Daerah Blank Spot, Rural, dan 3T',
		author: 'Purbo, Onno W.',
        year: '2024',
	},
]

export function ModalListCitations({ isOpen, onClose, citations, onDelete, onInsert }: ModalListCitationsProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-6 bg-white rounded-xl border-none shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                        Saved Sources
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[400px] mt-2 pr-4">
                    <div className="space-y-3">
                        {MOCK_CITATIONS.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">No sources found.</div>
                        ) : (
                            MOCK_CITATIONS.map((cit) => (
                                <div key={cit.id} className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-teal-50/50 transition-all border border-transparent hover:border-teal-100">
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
                                        <Button 
                                            size="sm" variant="ghost" 
                                            className="text-gray-400 hover:text-teal-600"
                                            onClick={() => onInsert(cit)}
                                        >
                                            <FileInput className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                            size="icon" variant="ghost" 
                                            onClick={() => onDelete(cit.id)}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}