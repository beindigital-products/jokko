import { Metadata } from 'next'
import AssignmentsV3Client from './_components/AssignmentsV3Client'

export const metadata: Metadata = {
    title: 'Assignations | Jokko',
    description: 'Routage automatique et file d’attribution des conversations',
}

export default function AssignmentsPage() {
    // Full-bleed route: rendered straight into #main-content by the dashboard
    // layout, so `h-full` fills the box exactly (banner-independent).
    return (
        <div className="h-full">
            <AssignmentsV3Client />
        </div>
    )
}
