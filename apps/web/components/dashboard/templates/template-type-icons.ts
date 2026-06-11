import {
    Boxes,
    GalleryHorizontalEnd,
    Image,
    KeyRound,
    List,
    MapPin,
    MessageSquareReply,
    MessageSquareText,
    MousePointerClick,
    Package,
    ReceiptText,
    Store,
    TicketPercent,
    Timer,
    Truck,
    type LucideIcon,
} from "lucide-react"

import type { TemplateType } from "@/convex/lib/templateTypes"

/**
 * Line-icon for each WhatsApp template type, replacing the emoji that lived in
 * the shared {@link TEMPLATE_TYPE_CONFIGS}. Kept on the frontend so the Convex
 * `convex/lib/templateTypes` stays free of React / lucide imports.
 */
export const TEMPLATE_TYPE_ICONS: Record<TemplateType, LucideIcon> = {
    // Base
    TEXT: MessageSquareText,
    MEDIA: Image,
    // Interactive
    QUICK_REPLY: MessageSquareReply,
    CALL_TO_ACTION: MousePointerClick,
    LIST: List,
    // E-commerce
    CATALOG: Store,
    SINGLE_PRODUCT: Package,
    MULTI_PRODUCT: Boxes,
    ORDER_DETAILS: ReceiptText,
    ORDER_STATUS: Truck,
    // Advanced
    CAROUSEL: GalleryHorizontalEnd,
    LOCATION: MapPin,
    LIMITED_TIME_OFFER: Timer,
    COUPON: TicketPercent,
    AUTHENTICATION: KeyRound,
}
