import type {
    ButtonType,
    HeaderType,
    TemplateCategory,
    TemplateStatus,
    TemplateType,
} from '@/convex/lib/templateTypes';
import type { Id } from '@/convex/_generated/dataModel';

export interface TemplateButtonData {
    type: ButtonType | string;
    text: string;
    url?: string;
    urlSuffix?: string;
    phoneNumber?: string;
    payload?: string;
    catalogId?: string;
    productRetailerId?: string;
}

export interface TemplateHeaderData {
    type: HeaderType | string;
    text?: string;
    url?: string;
    mediaUrl?: string;
    mediaStorageId?: Id<"_storage">;
    mediaHandle?: string;
}

export interface TemplateListRow {
    id: string;
    title: string;
    description: string;
}

export interface TemplateListSection {
    title: string;
    rows: TemplateListRow[];
}

export interface ExistingTemplateListSection {
    title?: string;
    rows: {
        id: string;
        title: string;
        description?: string;
    }[];
}

export interface TemplateCarouselEditorCard {
    title?: string;
    headerUrl?: string;
    body: string;
    buttons: TemplateButtonData[];
}

export interface ExistingTemplateCarouselCard {
    title?: string;
    header?: {
        mediaUrl?: string;
    };
    body: string;
    buttons: TemplateButtonData[];
}

export interface ExistingTemplateData {
    _id?: Id<"templates">;
    name?: string;
    language?: string;
    category?: TemplateCategory | string;
    type?: TemplateType | string;
    body?: string;
    header?: TemplateHeaderData;
    footer?: string;
    buttons?: TemplateButtonData[];
    listConfig?: {
        buttonText?: string;
        sections?: ExistingTemplateListSection[];
    };
    carouselCards?: ExistingTemplateCarouselCard[];
    status?: TemplateStatus | string;
}

export interface TemplateFormData {
    name: string;
    language: string;
    category: TemplateCategory | string;
    body: string;
    header?: TemplateHeaderData;
    footer: string;
    buttons: TemplateButtonData[];
    sections: TemplateListSection[];
    cards: TemplateCarouselEditorCard[];
}
