'use client';

import { useState } from 'react';
import {
    Upload,
    FileSpreadsheet,
    Check,
    ChevronRight,
    ChevronLeft,
    Loader2,
    Users,
    AlertTriangle,
    CheckCircle2,
    HelpCircle,
} from 'lucide-react';
import { ImportGuideDialog } from './ImportGuideDialog';

import { cn } from '@/lib/utils';
import Papa from 'papaparse';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

type ImportStep = 'upload' | 'mapping' | 'preview' | 'complete';

interface ImportResult {
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ phone: string; error: string }>;
}

interface ImportWizardProps {
    onComplete?: (result: ImportResult) => void;
    onCancel?: () => void;
}

type CsvRow = Record<string, string | undefined>;

interface ParsedContact {
    phone: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    company?: string;
    tags: string[];
}

function getCell(row: CsvRow, ...keys: string[]): string | undefined {
    return keys.map((key) => row[key]).find((value): value is string => Boolean(value));
}

const STEPS: { id: ImportStep; title: string }[] = [
    { id: 'upload', title: 'Fichier' },
    { id: 'mapping', title: 'Mapping' },
    { id: 'preview', title: 'Aperçu' },
    { id: 'complete', title: 'Terminé' },
];

function StepIndicator({ currentStep, steps }: { currentStep: ImportStep; steps: typeof STEPS }) {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);

    return (
        <div className="flex items-center gap-2">
            {steps.map((step, index) => {
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isLast = index === steps.length - 1;

                return (
                    <div key={step.id} className="flex flex-1 items-center gap-2">
                        <span
                            className={cn(
                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold',
                                isCompleted && 'bg-[var(--accent)] text-white',
                                isCurrent &&
                                    'bg-[var(--accent-muted)] text-[var(--accent)] ring-1 ring-[var(--accent)]',
                                !isCompleted &&
                                    !isCurrent &&
                                    'bg-[var(--paper-warm)] text-[var(--ink-soft)]'
                            )}
                        >
                            {isCompleted ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
                        </span>
                        <span
                            className={cn(
                                'font-mono text-[9.5px] uppercase tracking-[0.1em]',
                                isCurrent ? 'text-[var(--ink-900)]' : 'text-[var(--ink-soft)]'
                            )}
                        >
                            {step.title}
                        </span>
                        {!isLast && (
                            <span
                                className={cn(
                                    'h-px flex-1',
                                    index < currentIndex ? 'bg-[var(--accent)]' : 'bg-[var(--ink-100)]'
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function ImportWizard({ onComplete, onCancel }: ImportWizardProps) {
    const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
    const [importStats, setImportStats] = useState<ImportResult | null>(null);
    const [showGuide, setShowGuide] = useState(false);

    const batchCreate = useMutation(api.contacts.batchCreate);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleUpload = () => {
        if (!file) return;
        setIsLoading(true);

        Papa.parse<CsvRow>(file, {
            header: true,
            complete: (results) => {
                // Simplified mapping: map keys directly if they match, or guess
                const mapped: ParsedContact[] = results.data.map((row): ParsedContact | null => {
                    // Basic normalization
                    const phone = getCell(row, 'phone', 'Phone', 'Mobile', 'Téléphone');
                    if (!phone) return null; // Skip without phone

                    return {
                        phone: String(phone),
                        name: getCell(row, 'name', 'Name', 'Nom') || (row['First Name'] ? `${row['First Name']} ${row['Last Name'] || ''}`.trim() : undefined),
                        firstName: getCell(row, 'firstName', 'First Name', 'Prénom'),
                        lastName: getCell(row, 'lastName', 'Last Name', 'Nom'),
                        email: getCell(row, 'email', 'Email', 'E-mail'),
                        company: getCell(row, 'company', 'Company', 'Entreprise'),
                        tags: row['tags'] ? String(row['tags']).split(',').map(t => t.trim()) : []
                    };
                }).filter((contact): contact is ParsedContact => contact !== null);

                setParsedContacts(mapped);
                setIsLoading(false);
                setCurrentStep('mapping'); // Skip custom mapping UI for now, assume auto-map
            },
            error: (err) => {
                console.error("Parse error", err);
                setIsLoading(false);
                alert("Erreur lors de la lecture du fichier");
            }
        });

    };

    const handleMapping = () => {
        setCurrentStep('preview');
    };

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            const result = await batchCreate({ contacts: parsedContacts });
            setImportStats({
                created: result.created,
                updated: 0,
                skipped: 0,
                errors: result.errors || []
            });
            setCurrentStep('complete');
            onComplete?.({
                created: result.created,
                updated: 0,
                skipped: 0,
                errors: result.errors || []
            });
        } catch (err) {
            console.error("Import failed", err);
            const message = err instanceof Error ? err.message : "Erreur inconnue";
            alert("Erreur lors de l'import: " + message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderUploadStep = () => (
        <div className="py-6">
            <div className="relative rounded-xl border border-dashed border-[var(--ink-200)] bg-[var(--paper-warm)]/40 p-8 text-center transition-colors hover:bg-[var(--paper-warm)]">
                <input
                    type="file"
                    accept=".csv"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={handleFileChange}
                />
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-muted)]">
                    <Upload className="h-7 w-7 text-[var(--accent)]" />
                </div>
                <h3 className="mb-1 text-[15px] font-medium text-[var(--ink-900)]">
                    {file ? file.name : "Glissez-déposez votre fichier"}
                </h3>
                <p className="mb-4 text-[12.5px] text-[var(--ink-soft)]">
                    CSV supporté
                </p>
                <span className="pointer-events-none inline-flex items-center rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[13px] font-medium text-[var(--ink-700)]">
                    Parcourir
                </span>
            </div>

            <div className="mt-6 grid w-full gap-4">
                <div className="flex w-full items-center gap-3 rounded-xl border border-[var(--ink-200)] bg-[var(--paper-warm)]/40 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--status-good-soft)] text-[var(--status-good)]">
                        <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[13.5px] font-medium text-[var(--ink-900)]">Fichier CSV</p>
                        <p className="text-[11.5px] text-[var(--ink-soft)]">Format recommandé</p>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={() => setShowGuide(true)}
                className="mx-auto mt-4 flex items-center gap-2 text-[12.5px] font-medium text-[var(--accent)] hover:underline"
            >
                <HelpCircle className="h-4 w-4" />
                Comment récupérer mes contacts depuis mon smartphone ?
            </button>

            <ImportGuideDialog open={showGuide} onOpenChange={setShowGuide} />
        </div>
    );

    const renderMappingStep = () => (
        <div className="py-12 text-center">
            <div className="mb-6 flex flex-col items-center justify-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--status-good-soft)] text-[var(--status-good)]">
                    <Check className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <p className="text-[15px] font-semibold text-[var(--ink-900)]">{parsedContacts.length} contacts détectés</p>
            </div>
            <p className="mx-auto max-w-md text-[13px] text-[var(--ink-soft)]">
                Les colonnes ont été automatiquement associées. Cliquez sur continuer pour vérifier l&apos;aperçu.
            </p>
        </div>
    );

    const renderPreviewStep = () => (
        <div className="py-12 text-center">
            <AlertTriangle className="mx-auto mb-4 h-11 w-11 text-[var(--ink-400)]" />
            <p className="text-[15px] font-semibold text-[var(--ink-900)]">Prêt à importer {parsedContacts.length} contacts</p>
            <p className="text-[12.5px] text-[var(--ink-soft)]">Veuillez confirmer l&apos;importation</p>

            <div className="mt-4 max-h-40 overflow-y-auto rounded-xl border border-[var(--ink-200)] bg-[var(--paper-warm)]/40 p-3 text-left text-[12px]">
                {parsedContacts.slice(0, 5).map((c, i) => (
                    <div key={i} className="mb-1 truncate text-[var(--ink-700)]">{c.name || c.phone} - {c.phone}</div>
                ))}
                {parsedContacts.length > 5 && <div className="mt-2 text-center italic text-[var(--ink-soft)]">...et {parsedContacts.length - 5} autres</div>}
            </div>
        </div>
    );

    const renderCompleteStep = () => (
        <div className="space-y-4 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--status-good-soft)] text-[var(--status-good)]">
                <CheckCircle2 className="h-7 w-7" strokeWidth={2.5} />
            </div>

            <div>
                <h3 className="font-editorial text-[18px] font-normal leading-tight tracking-[-0.01em] text-[var(--ink-900)]">Import terminé</h3>
                <p className="mt-1 text-[13px] text-[var(--ink-soft)]">
                    {importStats?.created} contacts créés. {importStats?.errors?.length ? `${importStats.errors.length} erreurs.` : ''}
                </p>
            </div>

            {importStats?.errors && importStats.errors.length > 0 && (
                <div className="mt-4 max-h-40 overflow-auto rounded-xl border border-[var(--status-danger)]/20 bg-[var(--status-danger-soft)] p-3 text-left text-[12px] text-[var(--status-danger)]">
                    <p className="mb-1 font-semibold">Erreurs:</p>
                    {importStats.errors.map((e, i) => (
                        <div key={i}>{e.phone}: {e.error}</div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="flex h-full min-h-[480px] flex-col">
            <div className="border-b border-[var(--ink-200)] px-6 pb-4 pt-5">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                    Contacts · import
                </p>
                <h2 className="mb-4 mt-1 font-editorial text-[20px] font-normal leading-tight tracking-[-0.01em] text-[var(--ink-900)]">
                    Importer des contacts
                </h2>
                <StepIndicator currentStep={currentStep} steps={STEPS} />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
                {currentStep === 'upload' && renderUploadStep()}
                {currentStep === 'mapping' && renderMappingStep()}
                {currentStep === 'preview' && renderPreviewStep()}
                {currentStep === 'complete' && renderCompleteStep()}
            </div>

            <div className="flex justify-end border-t border-[var(--ink-200)] bg-[var(--paper-warm)]/40 px-6 py-3.5">
                {currentStep !== 'complete' ? (
                    <div className="flex w-full items-center justify-between gap-2">
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => {
                                if (currentStep === 'upload') onCancel?.();
                                else if (currentStep === 'mapping') setCurrentStep('upload');
                                else if (currentStep === 'preview') setCurrentStep('mapping');
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[13px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)] disabled:opacity-60"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            {currentStep === 'upload' ? 'Annuler' : 'Retour'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (currentStep === 'upload') handleUpload();
                                else if (currentStep === 'mapping') handleMapping();
                                else if (currentStep === 'preview') handleConfirm();
                            }}
                            disabled={isLoading || (currentStep === 'upload' && !file)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[var(--ink-700)] disabled:opacity-60"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Traitement...
                                </>
                            ) : (
                                <>
                                    {currentStep === 'preview' ? 'Importer' : 'Continuer'}
                                    {currentStep !== 'preview' && <ChevronRight className="h-4 w-4" />}
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[var(--ink-900)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[var(--ink-700)]"
                    >
                        <Users className="h-4 w-4" />
                        Voir les contacts
                    </button>
                )}
            </div>
        </div>
    );
}
