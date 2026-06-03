import { Metadata } from 'next'
import AssignmentsV3Client from './_components/AssignmentsV3Client'

export const metadata: Metadata = {
    title: 'Assignations | Jokko',
    description: 'Routage automatique et file d’attribution des conversations',
}

export default function AssignmentsPage() {
    // Full-bleed: escape the layout padding + own the viewport height so the v3
    // screen's internal header + scroll fill the area (mirrors overview / mentions).
    return (
        <div className="-m-3 h-[calc(100vh-3rem)] sm:-m-4 lg:-m-6">
            <AssignmentsV3Client />
        </div>
    )
}
