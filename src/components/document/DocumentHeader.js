"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  Share2,
  MessageSquare,
  X,
  RefreshCw
} from 'lucide-react'

const DocumentHeader = ({ 
  title, 
  setTitle, 
  aiAssistantOpen, 
  toggleAiAssistant,
  handleSave,
  isSaving,
  activeDropdown,
  toggleDropdown,
  paperSize,
  setPaperSize,
  paperSizeSubmenuOpen,
  setPaperSizeSubmenuOpen,
  user,
  workspaceId,
  documentId
}) => {
  const [isSyncing, setIsSyncing] = useState(false)

  return (
    <header className={`bg-white border-b border-gray-200 sticky top-0 z-40 transition-all duration-300 ${aiAssistantOpen ? 'mr-80' : 'mr-0'}`}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/${workspaceId}`} className="p-2 rounded-full hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="flex flex-col">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-medium text-lg text-gray-900 focus:outline-none border-b border-transparent focus:border-blue-500"
                placeholder="Untitled Document"
              />
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div 
                  className="dropdown-trigger hover:bg-gray-100 px-1 py-1 rounded relative cursor-pointer"
                  onClick={() => toggleDropdown('file')}
                >
                  File
                  {activeDropdown === 'file' && (
                    <div className="dropdown-menu absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48 z-50">
                      <div className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14,2 14,8 20,8"></polyline>
                        </svg>
                        New Document
                      </div>
                      <div className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14,2 14,8 20,8"></polyline>
                        </svg>
                        Open
                      </div>
                      <div className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                          <polyline points="17,21 17,13 7,13 7,21"></polyline>
                          <polyline points="7,3 7,8 15,8"></polyline>
                        </svg>
                        Save
                      </div>
                      <div 
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                        onClick={handleSave}
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                          <polyline points="17,21 17,13 7,13 7,21"></polyline>
                          <polyline points="7,3 7,8 15,8"></polyline>
                        </svg>
                        Save As
                      </div>
                      <hr className="my-1" />
                      <div className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6,9 6,2 18,2 18,9"></polyline>
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                          <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                        Print
                      </div>
                      <div className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7,10 12,15 17,10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download
                      </div>
                      <hr className="my-1" />
                      <div className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        </svg>
                        Make a Copy
                      </div>
                      <div className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                        <Share2 className="h-4 w-4" />
                        Share
                      </div>
                    </div>
                  )}
                </div>
                
                <div 
                  className="dropdown-trigger hover:bg-gray-100 px-1 py-1 rounded relative cursor-pointer"
                  onClick={() => toggleDropdown('appearance')}
                >
                  Appearance
                  {activeDropdown === 'appearance' && (
                    <div className="dropdown-menu absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-56 z-50">
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Page Setup
                      </div>
                      <div 
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between cursor-pointer relative"
                        onMouseEnter={() => setPaperSizeSubmenuOpen(true)}
                        onMouseLeave={() => setPaperSizeSubmenuOpen(false)}
                      >
                        <span className="flex items-center gap-2">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          </svg>
                          Paper Size
                        </span>
                        <span className="text-gray-500 text-sm">{paperSize}</span>
                        
                        {/* Paper Size Submenu */}
                        {paperSizeSubmenuOpen && (
                          <div 
                            className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-40 z-60"
                            onMouseEnter={() => setPaperSizeSubmenuOpen(true)}
                            onMouseLeave={() => setPaperSizeSubmenuOpen(false)}
                          >
                            <div 
                              className={`w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center justify-between ${paperSize === 'A4' ? 'bg-blue-50 text-blue-700' : ''}`}
                              onClick={() => {
                                setPaperSize('A4')
                                toggleDropdown(null)
                              }}
                            >
                              <span>A4</span>
                              {paperSize === 'A4' && (
                                <svg className="h-4 w-4 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20,6 9,17 4,12"></polyline>
                                </svg>
                              )}
                            </div>
                            <div 
                              className={`w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center justify-between ${paperSize === 'A3' ? 'bg-blue-50 text-blue-700' : ''}`}
                              onClick={() => {
                                setPaperSize('A3')
                                toggleDropdown(null)
                              }}
                            >
                              <span>A3</span>
                              {paperSize === 'A3' && (
                                <svg className="h-4 w-4 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20,6 9,17 4,12"></polyline>
                                </svg>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between cursor-pointer">
                        <span className="flex items-center gap-2">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                          </svg>
                          Orientation
                        </span>
                        <span className="text-gray-500 text-sm">Portrait</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div 
                  className="dropdown-trigger hover:bg-gray-100 px-1 py-1 rounded relative cursor-pointer"
                  onClick={() => toggleDropdown('settings')}
                >
                  Settings
                  {activeDropdown === 'settings' && (
                    <div className="dropdown-menu absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-52 z-50">
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Editor Settings
                      </div>
                      <div className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between cursor-pointer">
                        <span className="flex items-center gap-2">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10,9 9,9 8,9"></polyline>
                          </svg>
                          Auto Save
                        </span>
                        <span className="text-green-500 text-sm">On</span>
                      </div>
                      <div className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between cursor-pointer">
                        <span className="flex items-center gap-2">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3h18v18H3zM9 9h6v6H9z"></path>
                          </svg>
                          Spell Check
                        </span>
                        <span className="text-green-500 text-sm">On</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleAiAssistant}
              className={aiAssistantOpen ? "bg-blue-100 text-blue-700" : ""}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <div className="ml-2 flex items-center gap-2">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "User"}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0) || "U"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default DocumentHeader
