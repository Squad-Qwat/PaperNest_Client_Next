"use client"

import { useParams } from "next/navigation"

export default function Page() {
    const params = useParams();

    return <h1>Hello World Workspace {params.workspaceid}</h1>
}