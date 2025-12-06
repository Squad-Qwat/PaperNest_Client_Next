import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, Inbox } from 'lucide-react'

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
    onDelete: (id: string) => void;
    onInsert: (text: string) => void
}

const MOCK_CITATIONS: Citation[] = [
	{
		id: '1',
		sourceTitle: 'Twentieth Century Design',
		author: 'Seddon, Tony',
        year: '2014',
		color: 'bg-red-500',
	},
	{
		id: '2',
		sourceTitle: '500 Resep Masakan Terfavorit',
		author: 'Soewitomo, Sisca',
        year: '2011',
		color: 'bg-violet-500',
	},
	{
		id: '3',
		sourceTitle: 'Sebuah Seni untuk Bersikap Bodo Amat',
		author: 'Manson, Mark',
        year: '2016',
		color: 'bg-orange-500',
	},
	{
		id: '4',
		sourceTitle: 'Internet Offline, Solusi Daerah Blank Spot, Rural, dan 3T',
		author: 'Purbo, Onno W.',
        year: '2024',
		color: 'bg-orange-500',
	},
]

export function ModalListCitations({ isOpen, onClose, citations, onDelete, onInsert }: ModalCitationsProps) {
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
                        {MOCK_CITATIONS.map((cit) => (
                            <div key={cit.id} className="group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-teal-500 transition-all">
                                <div className="flex gap-3 items-start">
                                    <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${cit.color || 'bg-gray-300'}`} />
                                    <div>
                                        <h4 className="font-bold text-gray-800 leading-tight">{cit.sourceTitle}</h4>
                                        <p className="text-sm text-gray-500 mt-1">{cit.author} • {cit.year}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button 
                                        size="sm" variant="ghost" 
                                        className="text-gray-300 hover:bg-teal-50 group-hover:opacity-100 transition-opacity"
                                        onClick={() => onInsert(`(${cit.author}, ${cit.year})`)}
                                    >
                                        <Inbox className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        size="icon" variant="ghost" 
                                        onClick={() => onDelete(cit.id)}
                                        className="text-gray-300 hover:text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}