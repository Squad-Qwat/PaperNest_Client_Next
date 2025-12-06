"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/store";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

interface NavbarProps {
    mode?: "workspace" | "document";
    documentId?: string;
}

export function Navbar({ mode = "workspace", documentId }: NavbarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { currentUser, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const workspaceId = currentUser?.id.toString();

    // Main workspace menu items
    const workspaceMenuItems = [
        { name: "Overview", href: `/${workspaceId}` },
        { name: "Chatbot", href: `/${workspaceId}/chatbot` },
        { name: "Review", href: `/${workspaceId}/review-requests` },
        { name: "Settings", href: `/${workspaceId}/settings` },
    ];

    // Document-specific menu items
    const documentMenuItems = documentId
        ? [
            {
                name: "Overview",
                href: `/${workspaceId}/documents/${documentId}`
            },
            {
                name: "Citations",
                href: `/${workspaceId}/documents/${documentId}/citations`,
            },
            {
                name: "Reviews",
                href: `/${workspaceId}/documents/${documentId}/reviews`,
            },
            {
                name: "Versions",
                href: `/${workspaceId}/documents/${documentId}/versions`,
            }
        ]
        : [];

    const menuItems = mode === "document" ? documentMenuItems : workspaceMenuItems;

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const isActive = (href: string) => {
        if (href === `/${workspaceId}`) {
            return pathname === `/${workspaceId}`;
        }
        return pathname.startsWith(href);
    };

    if (!currentUser) return null;

    return (
        <>
            <nav className="sticky top-0 z-40 bg-white border-b shadow-sm">
                <div className="mx-auto pt-3 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo/Brand */}
                        <div>
                            <div className="flex items-center gap-3">
                                <Link
                                    href={`/${workspaceId}`}
                                    className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors"
                                >
                                    <span>PaperNest</span>
                                </Link>
                                <span className="px-2 py-0.5 bg-teal-600 text-white text-xs font-medium rounded">Hobby</span>
                            </div>

                            {/* Desktop Menu */}
                            <div className="hidden md:flex items-center gap-8">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "relative px-1 py-2 text-sm font-normal transition-colors",
                                            isActive(item.href)
                                                ? "text-gray-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-teal-600"
                                                : "text-gray-600 hover:text-gray-900"
                                        )}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* User Actions */}
                        <div className="hidden md:flex items-center gap-6">
                            {/* Keluar Link */}
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Keluar
                            </button>

                            {/* Notifications Button */}
                            <button
                                onClick={() => router.push("/notifications")}
                                className="p-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                                aria-label="Notifications"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                </svg>
                            </button>

                            {/* User Menu */}
                            <button
                                onClick={() => router.push("/profile")}
                                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                            >
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                        {currentUser.firstName} {currentUser.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-700 font-medium border border-gray-300">
                                    {currentUser.firstName[0]}
                                    {currentUser.lastName[0]}
                                </div>
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden py-4 border-t border-gray-800">
                            <div className="flex flex-col gap-2 mb-4">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                            isActive(item.href)
                                                ? "bg-blue-600 text-white"
                                                : "text-gray-300 hover:bg-gray-800"
                                        )}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>

                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 rounded-lg border border-gray-800 mb-3">
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        router.push("/profile");
                                    }}
                                    className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold"
                                >
                                    {currentUser.firstName[0]}
                                    {currentUser.lastName[0]}
                                </button>
                                <div>
                                    <p className="text-sm font-medium text-gray-200">
                                        {currentUser.firstName} {currentUser.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">{currentUser.role}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        router.push("/notifications");
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-lg transition-colors"
                                >
                                    Notifications
                                </button>
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        setShowLogoutConfirm(true);
                                    }}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Logout Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
                title="Confirm Logout"
                message="Are you sure you want to logout?"
                confirmText="Logout"
                variant="warning"
            />
        </>
    );
}
