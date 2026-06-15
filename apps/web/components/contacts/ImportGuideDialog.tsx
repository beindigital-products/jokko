'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Smartphone, ChevronRight } from 'lucide-react';

interface ImportGuideDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function StepList({ steps }: { steps: string[] }) {
    return (
        <ol className="mt-3 space-y-3">
            {steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-[13px]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] font-mono text-[11px] font-semibold text-[var(--accent)]">
                        {i + 1}
                    </span>
                    <span className="leading-6 text-[var(--ink-700)]">{step}</span>
                </li>
            ))}
        </ol>
    );
}

const IPHONE_ICLOUD_STEPS = [
    'Ouvrez l\'app Réglages sur votre iPhone.',
    'Appuyez sur votre nom (Apple ID) en haut, puis sur iCloud.',
    'Vérifiez que Contacts est activé pour la synchronisation iCloud.',
    'Sur votre ordinateur, allez sur icloud.com et connectez-vous.',
    'Cliquez sur Contacts.',
    'Sélectionnez tous les contacts (⌘+A ou Ctrl+A).',
    'Cliquez sur l\'icône ⚙️ en bas à gauche, puis "Exporter en vCard...".',
    'Un fichier .vcf sera téléchargé. Convertissez-le en CSV avec un outil en ligne gratuit (ex: vcard-to-csv.com).',
    'Importez le fichier CSV dans Jokko.',
];

const IPHONE_DIRECT_STEPS = [
    'Ouvrez l\'app Contacts sur votre iPhone.',
    'Appuyez sur Listes en haut à gauche.',
    'Appuyez longuement sur la liste "Tous les contacts".',
    'Sélectionnez "Exporter" dans le menu.',
    'Choisissez de vous envoyer le fichier par e-mail ou AirDrop.',
    'Récupérez le fichier .vcf sur votre ordinateur.',
    'Convertissez le fichier .vcf en CSV (ex: vcard-to-csv.com).',
    'Importez le fichier CSV dans Jokko.',
];

const ANDROID_GOOGLE_STEPS = [
    'Sur votre ordinateur, allez sur contacts.google.com.',
    'Connectez-vous avec le même compte Google que votre téléphone.',
    'Dans le menu à gauche, cliquez sur "Exporter".',
    'Sélectionnez les contacts à exporter (ou tous).',
    'Choisissez le format "Google CSV".',
    'Cliquez sur "Exporter" pour télécharger le fichier.',
    'Importez le fichier CSV dans Jokko.',
];

const ANDROID_DIRECT_STEPS = [
    'Ouvrez l\'app Contacts sur votre téléphone Android.',
    'Appuyez sur le menu ☰ ou les 3 points ⋮.',
    'Sélectionnez "Paramètres" ou "Gérer les contacts".',
    'Appuyez sur "Exporter les contacts".',
    'Choisissez l\'emplacement de sauvegarde (stockage interne ou carte SD).',
    'Le fichier .vcf sera enregistré. Transférez-le sur votre ordinateur (câble USB, e-mail, ou Google Drive).',
    'Convertissez le fichier .vcf en CSV si nécessaire.',
    'Importez le fichier CSV dans Jokko.',
];

export function ImportGuideDialog({ open, onOpenChange }: ImportGuideDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border-[var(--ink-200)] bg-[var(--paper-white)]">
                <DialogHeader className="space-y-0 text-left">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        Contacts · guide
                    </p>
                    <DialogTitle className="mt-1 flex items-center gap-2 font-editorial text-[20px] font-normal leading-tight tracking-[-0.01em] text-[var(--ink-900)]">
                        <Smartphone className="h-5 w-5 text-[var(--ink-400)]" />
                        Comment récupérer mes contacts ?
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-[13px] leading-snug text-[var(--ink-500)]">
                        Suivez ces étapes pour exporter vos contacts depuis votre smartphone, puis importez le fichier CSV dans Jokko.
                    </DialogDescription>
                </DialogHeader>

                <Accordion type="single" collapsible className="w-full">
                    {/* iPhone Section */}
                    <AccordionItem value="iphone-icloud" className="border-[var(--ink-100)]">
                        <AccordionTrigger className="text-[13px] text-[var(--ink-900)]">
                            <span className="flex items-center gap-2">
                                <span className="text-lg">🍎</span>
                                iPhone — via iCloud (recommandé)
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <StepList steps={IPHONE_ICLOUD_STEPS} />
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="iphone-direct" className="border-[var(--ink-100)]">
                        <AccordionTrigger className="text-[13px] text-[var(--ink-900)]">
                            <span className="flex items-center gap-2">
                                <span className="text-lg">🍎</span>
                                iPhone — export direct (iOS 16+)
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <StepList steps={IPHONE_DIRECT_STEPS} />
                        </AccordionContent>
                    </AccordionItem>

                    {/* Android Section */}
                    <AccordionItem value="android-google" className="border-[var(--ink-100)]">
                        <AccordionTrigger className="text-[13px] text-[var(--ink-900)]">
                            <span className="flex items-center gap-2">
                                <span className="text-lg">🤖</span>
                                Android — via Google Contacts (recommandé)
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <StepList steps={ANDROID_GOOGLE_STEPS} />
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="android-direct" className="border-[var(--ink-100)]">
                        <AccordionTrigger className="text-[13px] text-[var(--ink-900)]">
                            <span className="flex items-center gap-2">
                                <span className="text-lg">🤖</span>
                                Android — export depuis l&apos;app Contacts
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <StepList steps={ANDROID_DIRECT_STEPS} />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                {/* Tips */}
                <div className="mt-2 rounded-xl border border-[var(--ink-100)] bg-[var(--paper-warm)] p-4">
                    <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">Conseils</p>
                    <ul className="space-y-1.5 text-[12px] text-[var(--ink-700)]">
                        <li className="flex items-start gap-1.5">
                            <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-[var(--ink-400)]" />
                            <span>Le fichier CSV doit contenir au minimum une colonne <strong className="font-medium text-[var(--ink-900)]">phone</strong> ou <strong className="font-medium text-[var(--ink-900)]">Téléphone</strong>.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                            <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-[var(--ink-400)]" />
                            <span>Les colonnes <strong className="font-medium text-[var(--ink-900)]">name</strong>, <strong className="font-medium text-[var(--ink-900)]">email</strong> et <strong className="font-medium text-[var(--ink-900)]">company</strong> seront automatiquement détectées.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                            <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-[var(--ink-400)]" />
                            <span>Les numéros doivent inclure l&apos;indicatif pays (ex: +221 77 123 45 67).</span>
                        </li>
                    </ul>
                </div>
            </DialogContent>
        </Dialog>
    );
}
