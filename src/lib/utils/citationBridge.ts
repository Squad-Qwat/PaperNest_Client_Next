import type { Citation as DbCitation } from '@/lib/api/types/citation.types'; // Update with your actual path

export type ManagerCitationType =
  | 'article'       // Journal Article
  | 'conference'    // Conference Paper
  | 'thesis'        // Professor's Doctoral Thesis
  | 'discrete'      // Magister's Discrete
  | 'script'        // Fresh Graduate's Script
  | 'book'          // Book
  | 'website';      // Website\
  // | 'report'
  // | 'blog'

export interface ManagerCitation {
  id: string;
  index: number;           // auto-managed sequential index
  type: ManagerCitationType;
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

/**
 * Formats modular frontend fields into a clean, human-readable publicationInfo string.
 * This ensures standard components or tables display the info beautifully.
 */
export function formatPublicationInfo(cit: Partial<ManagerCitation>): string {
  const parts: string[] = [];
  
  if (cit.type === 'article') {
    if (cit.bookTitle) parts.push(cit.bookTitle);
    if (cit.volume) parts.push(`Vol. ${cit.volume}`);
    if (cit.numbers) parts.push(`No. ${cit.numbers}`);
    if (cit.pagesFrom || cit.pagesTo) {
      parts.push(`pp. ${cit.pagesFrom || ''}-${cit.pagesTo || ''}`);
    }
  } else if (cit.type === 'conference') {
    if (cit.bookTitle) parts.push(`In ${cit.bookTitle}`);
    if (cit.location) parts.push(cit.location);
    if (cit.pagesFrom || cit.pagesTo) {
      parts.push(`pp. ${cit.pagesFrom || ''}-${cit.pagesTo || ''}`);
    }
  } else if (cit.type && ['thesis', 'discrete', 'script'].includes(cit.type)) {
    if (cit.institution) parts.push(cit.institution);
    if (cit.publicationNumber) parts.push(cit.publicationNumber);
    if (cit.location) parts.push(cit.location);
  } else {
    if (cit.bookTitle) parts.push(cit.bookTitle);
  }
  
  return parts.filter(Boolean).join(', ');
}

/**
 * TRANSLATION 1: ManagerCitation (Frontend Component state) -> DbCitation (API Payload Format)
 */
export function toDbCitation(
  managerCit: ManagerCitation, 
  workspaceId: string, 
  documentId?: string
): Omit<DbCitation, 'createdAt' | 'updatedAt'> {
  return {
    citationId: managerCit.id,
    workspaceId,
    documentId,
    type: managerCit.type,
    title: managerCit.sourceTitle,
    author: Array.isArray(managerCit.authors) ? managerCit.authors.join(', ') : '',
    publicationInfo: formatPublicationInfo(managerCit),
    doi: managerCit.doi || null,
    url: managerCit.url || null,
    accessDate: '',
    publicationDate: managerCit.year || '',
    cslJson: {
      // Keep standard CSL attributes for standard styling tools
      type: managerCit.type === 'article' ? 'article-journal' : managerCit.type,
      title: managerCit.sourceTitle,
      DOI: managerCit.doi || null,
      URL: managerCit.url || null,
      containerTitle: managerCit.bookTitle || null,
      volume: managerCit.volume || null,
      issue: managerCit.numbers || null,
      // Store a flawless blueprint copy of frontend-specific parameters losslessly
      managerFields: { ...managerCit }
    }
  };
}

/**
 * TRANSLATION 2: DbCitation (API Response) -> ManagerCitation (Frontend Component State)
 */
export function toManagerCitation(dbCit: DbCitation, fallbackIndex: number = 0): ManagerCitation {
  // If the record was built by our frontend manager, instantly restore original structure
  if (dbCit.cslJson && dbCit.cslJson.managerFields) {
    return {
      ...dbCit.cslJson.managerFields,
      id: dbCit.citationId || dbCit.cslJson.managerFields.id,
      index: typeof dbCit.cslJson.managerFields.index === 'number' 
        ? dbCit.cslJson.managerFields.index 
        : fallbackIndex
    };
  }

  // Fallback parsing strategy if data is imported externally or lacks embedded metadata
  const csl = dbCit.cslJson || {};
  let pagesFrom = '';
  let pagesTo = '';
  
  if (csl.page && typeof csl.page === 'string') {
    const splitPages = csl.page.split('-');
    pagesFrom = splitPages[0] || '';
    pagesTo = splitPages[1] || '';
  }

  return {
    id: dbCit.citationId,
    index: fallbackIndex,
    type: (dbCit.type || 'article') as ManagerCitationType,
    sourceTitle: dbCit.title || '',
    authors: dbCit.author ? dbCit.author.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
    year: dbCit.publicationDate || '',
    bookTitle: csl.containerTitle || dbCit.publicationInfo || '',
    volume: csl.volume || undefined,
    numbers: csl.issue || undefined,
    pagesFrom: pagesFrom || undefined,
    pagesTo: pagesTo || undefined,
    url: dbCit.url || undefined,
    doi: dbCit.doi || undefined
  };
}