'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { ContactForm, type ContactFormInitialData, type ContactFormSubmitData } from './ContactForm';

interface ContactFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    initialData?: ContactFormInitialData;
    onSubmit: (data: ContactFormSubmitData) => Promise<void>;
    isLoading?: boolean;
}

export function ContactFormDialog({
    open,
    onOpenChange,
    mode,
    initialData,
    onSubmit,
    isLoading
}: ContactFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-[var(--ink-200)] bg-[var(--paper-white)]">
                <DialogHeader className="space-y-0 text-left">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        {mode === 'create' ? 'Annuaire · nouveau' : 'Annuaire · édition'}
                    </p>
                    <DialogTitle className="mt-1 font-editorial text-[20px] font-normal leading-tight tracking-[-0.01em] text-[var(--ink-900)]">
                        {mode === 'create' ? 'Nouveau contact' : 'Modifier le contact'}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-[13px] leading-snug text-[var(--ink-500)]">
                        {mode === 'create'
                            ? "Ajoutez les informations pour créer un nouveau contact."
                            : "Modifiez les informations existantes de ce contact."}
                    </DialogDescription>
                </DialogHeader>
                <ContactForm
                    mode={mode}
                    initialData={initialData}
                    tags={[]} // Tags are handled internally in form for creation/managment
                    onSubmit={onSubmit}
                    isLoading={isLoading}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    )
}

export default ContactFormDialog
