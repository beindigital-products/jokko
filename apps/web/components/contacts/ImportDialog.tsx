'use client';

import {
    Dialog,
    DialogContent
} from '@/components/ui/dialog';
import { ImportWizard } from './ImportWizard';

interface ImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: () => void;
}

export function ImportDialog({ open, onOpenChange, onComplete }: ImportDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl gap-0 overflow-hidden border-[var(--ink-200)] bg-[var(--paper-white)] p-0">
                <ImportWizard
                    onComplete={() => {
                        onComplete();
                        onOpenChange(false);
                    }}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    )
}
