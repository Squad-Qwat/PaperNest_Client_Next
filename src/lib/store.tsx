"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type {
  User,
  Document,
  Citation,
  Review,
  AuthContextType,
  DocumentContextType,
} from "@/types";

// Mock data migrated from global-object.js
const initialUsers: User[] = 
[
  {
    id: 1,
    email: "abiyyu@example.com",
    password: "12345678",
    firstName: "Abiyyu",
    lastName: "Cakra",
    username: "abiyyucakra",
    role: "Student",
    workspace: {
      icon: "📚",
      name: "My Research Space",
      description: "Personal research workspace",
    },
    documents: [
      {
        id: 1,
        title: "Machine Learning in Healthcare",
        description: "Research paper on ML applications in medical diagnosis",
        status: "personal",
        lastUpdated: "2 jam yang lalu",
        citations: [
          {
            id: "1-0",
            docId: 1,
            docTitle: "Machine Learning in Healthcare",
            title: "Deep Learning for Medical Image Analysis",
            authors: "Smith, J., & Johnson, M.",
            publicationYear: 2022,
            publisher: "Nature Medicine",
          },
        ],
        reviews: [
          {
            id: "1-0",
            docId: 1,
            docTitle: "Machine Learning in Healthcare",
            title: "Initial Review",
            reviewer: "Dr. Anderson",
            comment: "Excellent research methodology and clear presentation.",
            date: "2024-01-15",
            status: "approved",
          },
        ],
      },
      {
        id: 2,
        title: "Climate Change Impact Study",
        description: "Analysis of climate patterns over the last decade",
        status: "shared",
        lastUpdated: "1 hari yang lalu",
        citations: [],
        reviews: [
          {
            id: "2-0",
            docId: 2,
            docTitle: "Climate Change Impact Study",
            title: "Preliminary Review",
            reviewer: "Prof. Green",
            comment: "Needs more data to support conclusions.",
            date: "2024-01-10",
            status: "pending",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    email: "lecturer@example.com",
    password: "password123",
    firstName: "Sarah",
    lastName: "Williams",
    username: "sarahwilliams",
    role: "Lecturer",
    workspace: {
      icon: "🎓",
      name: "Academic Publications",
      description: "My academic research and publications",
    },
    documents: [
      {
        id: 1,
        title: "Quantum Computing Fundamentals",
        description: "Introduction to quantum computing for beginners",
        status: "shared",
        lastUpdated: "3 hari yang lalu",
        citations: [
          {
            id: "1-0",
            docId: 1,
            docTitle: "Quantum Computing Fundamentals",
            title: "Quantum Mechanics Principles",
            authors: "Einstein, A., & Bohr, N.",
            publicationYear: 2020,
            publisher: "Physics Review",
          },
          {
            id: "1-1",
            docId: 1,
            docTitle: "Quantum Computing Fundamentals",
            title: "Modern Quantum Algorithms",
            authors: "Chen, L., & Park, K.",
            publicationYear: 2023,
            publisher: "ACM Computing Surveys",
          },
        ],
        reviews: [],
      },
      {
        id: 2,
        title: "Educational Technology Trends",
        description: "Survey of emerging technologies in education",
        status: "personal",
        lastUpdated: "1 minggu yang lalu",
        citations: [
          {
            id: "2-0",
            docId: 2,
            docTitle: "Educational Technology Trends",
            title: "AI in Education",
            authors: "Brown, R., et al.",
            publicationYear: 2023,
            publisher: "Educational Research Quarterly",
          },
        ],
        reviews: [
          {
            id: "2-0",
            docId: 2,
            docTitle: "Educational Technology Trends",
            title: "Peer Review",
            reviewer: "Dr. Martinez",
            comment: "Good overview but needs more case studies.",
            date: "2023-12-20",
            status: "rejected",
          },
        ],
      },
      {
        id: 3,
        title: "Blockchain in Supply Chain",
        description: "Research on blockchain applications in logistics",
        status: "shared",
        lastUpdated: "2 minggu yang lalu",
        citations: [],
        reviews: [],
      },
    ],
  },
];

// Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Document Context
const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined
);

export function AppProvider({ children }: { children: React.ReactNode }) 
{
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(
    initialUsers[1] // Default to user ID 2 (lecturer) as in original code
  );

  // Auth methods
  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const user = users.find(
        (u) => u.email === email && u.password === password
      );
      if (user) {
        const now = new Date().toISOString();
        const updatedUser = { ...user, lastLogin: now };
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? updatedUser : u))
        );
        setCurrentUser(updatedUser);
        return true;
      }
      return false;
    },
    [users]
  );

  const logout = useCallback(() => {setCurrentUser(null);}, []);

  const register = useCallback(
    async (userData: Omit<User, "id" | "documents">): Promise<User> => 
    {
      const newId = Math.max(...users.map((u) => u.id)) + 1;
      const newUser: User = 
      {
        ...userData,
        id: newId,
        documents: [],
      };
      setUsers((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
      return newUser;
    },
    [users]
  );

  const switchUser = useCallback(
    (userId: number) => {
      const user = users.find((u) => u.id === userId);
      if (user) {setCurrentUser(user);}
    },
    [users]
  );

  const updateUser = useCallback((userId: number, updates: Partial<User>) => 
  {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );
    setCurrentUser((prev) =>
      prev?.id === userId ? { ...prev, ...updates } : prev
    );
  }, []);

  // Document methods
  const getDocuments = useCallback(
    (userId: number): Document[] => 
    {
      const user = users.find((u) => u.id === userId);
      return user?.documents || [];
    },
    [users]
  );

  const getDocument = useCallback(
    (userId: number, docId: number): Document | undefined => 
    {
      const user = users.find((u) => u.id === userId);
      return user?.documents.find((d) => d.id === docId);
    },
    [users]
  );

  const createDocument = useCallback(
    (
      userId: number,
      document: Omit<Document, "id" | "citations" | "reviews">
    ): Document => 
    {
      const user = users.find((u) => u.id === userId);
      if (!user) throw new Error("User not found");

      const newId =
        user.documents.length > 0
          ? Math.max(...user.documents.map((d) => d.id)) + 1
          : 1;
      const newDocument: Document = {
        ...document,
        id: newId,
        citations: [],
        reviews: [],
      };

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, documents: [...u.documents, newDocument] }
            : u
        )
      );

      if (currentUser?.id === userId) 
      {
        setCurrentUser((prev) =>
          prev ? { ...prev, documents: [...prev.documents, newDocument] } : prev
        );
      }

      return newDocument;
    },
    [users, currentUser]
  );

  const updateDocument = useCallback(
    (userId: number, docId: number, updates: Partial<Document>) => 
    {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                documents: u.documents.map((d) =>
                  d.id === docId ? { ...d, ...updates } : d
                ),
              }
            : u
        )
      );

      if (currentUser?.id === userId) 
      {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                documents: prev.documents.map((d) =>
                  d.id === docId ? { ...d, ...updates } : d
                ),
              }
            : prev
        );
      }
    },
    [currentUser]
  );

  const deleteDocument = useCallback(
    (userId: number, docId: number) => 
    {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, documents: u.documents.filter((d) => d.id !== docId) }
            : u
        )
      );

      if (currentUser?.id === userId) 
      {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                documents: prev.documents.filter((d) => d.id !== docId),
              }
            : prev
        );
      }
    },
    [currentUser]
  );

  const addCitation = useCallback(
    (
      userId: number,
      docId: number,
      citation: Omit<Citation, "id" | "docId" | "docTitle">
    ) => 
    {
      const user = users.find((u) => u.id === userId);
      const document = user?.documents.find((d) => d.id === docId);
      if (!document) {return;}

      const newCitation: Citation = 
      {
        ...citation,
        id: `${docId}-${document.citations.length}`,
        docId,
        docTitle: document.title,
      };

      updateDocument(userId, docId, {citations: [...document.citations, newCitation],});
    },
    [users, updateDocument]
  );

  const deleteCitation = useCallback(
    (userId: number, docId: number, citationId: string) => 
    {
      const user = users.find((u) => u.id === userId);
      const document = user?.documents.find((d) => d.id === docId);
      if (!document) {return;}

      updateDocument(userId, docId, {citations: document.citations.filter((c) => c.id !== citationId),});
    },
    [users, updateDocument]
  );

  const addReview = useCallback(
    (
      userId: number,
      docId: number,
      review: Omit<Review, "id" | "docId" | "docTitle">
    ) => 
    {
      const user = users.find((u) => u.id === userId);
      const document = user?.documents.find((d) => d.id === docId);
      if (!document) {return;}

      const newReview: Review = {
        ...review,
        id: `${docId}-${document.reviews.length}`,
        docId,
        docTitle: document.title,
      };

      updateDocument(userId, docId, {reviews: [...document.reviews, newReview],});
    },
    [users, updateDocument]
  );

  const deleteReview = useCallback(
    (userId: number, docId: number, reviewId: string) => 
    {
      const user = users.find((u) => u.id === userId);
      const document = user?.documents.find((d) => d.id === docId);
      if (!document) {return;}

      updateDocument(userId, docId, {reviews: document.reviews.filter((r) => r.id !== reviewId),});
    },
    [users, updateDocument]
  );

  const authValue: AuthContextType = 
  {
    currentUser,
    users,
    login,
    logout,
    register,
    switchUser,
    updateUser,
  };

  const documentValue: DocumentContextType = 
  {
    getDocuments,
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    addCitation,
    deleteCitation,
    addReview,
    deleteReview,
  };

  return (
    <AuthContext.Provider value={authValue}>
      <DocumentContext.Provider value={documentValue}>
        {children}
      </DocumentContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth() 
{
  const context = useContext(AuthContext);
  if (context === undefined) {throw new Error("useAuth must be used within an AppProvider");}
  return context;
}

export function useDocuments() 
{
  const context = useContext(DocumentContext);
  if (context === undefined) {throw new Error("useDocuments must be used within an AppProvider");}
  return context;
}