"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import {
  IconDashboard,
  IconFileDescription,
  IconMessage2,
  IconSettings,
  IconHelp,
  IconSearch,
  IconFiles,
  IconBook,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { useAuthContext } from "@/context/AuthContext"
import { useWorkspace } from "@/lib/api/hooks/use-workspaces"
import { WorkspaceSettingsModal } from "@/components/workspace/WorkspaceSettingsModal"
import { CreateDocumentModal } from "@/components/document/CreateDocumentModal"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInput,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher"
import { Search } from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthContext()
  const params = useParams()
  const workspaceId = params.workspaceid as string
  const { data: workspace } = useWorkspace(workspaceId)
  const [showSettingsModal, setShowSettingsModal] = React.useState(false)
  const [showCreateModal, setShowCreateModal] = React.useState(false)

  const data = {
    user: {
      name: user?.name || user?.email?.split('@')[0] || "User",
      email: user?.email || "",
      avatar: user?.photoURL || "",
    },
    navMain: [
      {
        title: "Dashboard",
        url: `/${workspaceId}`,
        icon: IconDashboard,
      },
      {
        title: "Documents",
        url: `/${workspaceId}`,
        icon: IconFileDescription,
        isActive: true,
      },
      {
        title: "Reviews",
        url: `/${workspaceId}/reviews`,
        icon: IconMessage2,
      },
    ],
    navSecondary: [
      {
        title: "Settings",
        url: "#",
        icon: IconSettings,
        onClick: () => setShowSettingsModal(true),
      },
      {
        title: "Guide",
        url: "/guide",
        icon: IconBook,
      },
      {
        title: "Help",
        url: "#",
        icon: IconHelp,
      },
      {
        title: "Search",
        url: "#",
        icon: IconSearch,
      },
    ],
  }

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher currentWorkspaceId={workspaceId} />
        <SidebarGroup className="-ml-0.5 py-0">
          <SidebarGroupContent className="relative">
            <SidebarInput 
              placeholder="Search documents..." 
              className="pl-8"
            />
            <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>
      <SidebarContent>
        <NavMain 
          items={data.navMain} 
          onCreateDocument={() => setShowCreateModal(true)}
        />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      {workspace && (
        <WorkspaceSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          workspace={workspace}
        />
      )}
      <CreateDocumentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        workspaceId={workspaceId}
      />
    </Sidebar>
  )
}
