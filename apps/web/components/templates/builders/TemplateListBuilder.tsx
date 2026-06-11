import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { TextField } from '@/components/dashboard/templates/form-controls';

interface ListRow {
    id: string;
    title: string;
    description: string;
}

interface ListSection {
    title: string;
    rows: ListRow[];
}

interface TemplateListBuilderProps {
    sections: ListSection[];
    onChange: (sections: ListSection[]) => void;
    maxSections?: number;
}

/** Compact labelled input used inside the list rows. */
function MiniField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1 block font-mono text-[9.5px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                {label}
            </span>
            {children}
        </label>
    );
}

const dashedButtonCls =
    'flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--ink-200)] py-2 text-[12px] font-medium text-[var(--ink-500)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]';

const iconDeleteCls =
    'grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--ink-200)] text-[var(--ink-400)] transition hover:bg-[var(--paper-white)] hover:text-[var(--status-danger)]';

export const TemplateListBuilder: React.FC<TemplateListBuilderProps> = ({
    sections = [],
    onChange,
    maxSections = 10,
}) => {
    const handleAddSection = () => {
        if (sections.length < maxSections) {
            onChange([...sections, { title: '', rows: [] }]);
        }
    };

    const handleRemoveSection = (index: number) => {
        onChange(sections.filter((_, i) => i !== index));
    };

    const handleUpdateSection = (index: number, title: string) => {
        const newSections = [...sections];
        newSections[index] = { ...newSections[index], title };
        onChange(newSections);
    };

    const handleAddRow = (sectionIndex: number) => {
        const newSections = sections.map((s) => ({ ...s, rows: [...s.rows] }));
        newSections[sectionIndex].rows.push({ id: '', title: '', description: '' });
        onChange(newSections);
    };

    const handleUpdateRow = (sectionIndex: number, rowIndex: number, field: keyof ListRow, value: string) => {
        const newSections = sections.map((s) => ({ ...s, rows: [...s.rows] }));
        newSections[sectionIndex].rows[rowIndex] = {
            ...newSections[sectionIndex].rows[rowIndex],
            [field]: value,
        };
        onChange(newSections);
    };

    const handleRemoveRow = (sectionIndex: number, rowIndex: number) => {
        const newSections = sections.map((s) => ({ ...s, rows: [...s.rows] }));
        newSections[sectionIndex].rows.splice(rowIndex, 1);
        onChange(newSections);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[var(--ink-700)]">Sections de la liste</span>
                {sections.length < maxSections && (
                    <button
                        type="button"
                        onClick={handleAddSection}
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[var(--accent)] transition hover:bg-[var(--accent-muted)]"
                    >
                        <Plus className="h-3 w-3" />
                        Ajouter une section
                    </button>
                )}
            </div>

            {sections.map((section, sIndex) => (
                <div key={sIndex} className="space-y-3 rounded-xl border border-[var(--ink-200)] bg-[var(--paper-warm)] p-4">
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <MiniField label="Titre de la section">
                                <TextField
                                    value={section.title}
                                    onChange={(e) => handleUpdateSection(sIndex, e.target.value)}
                                    placeholder="Ex. Plats principaux"
                                    maxLength={24}
                                />
                            </MiniField>
                        </div>
                        <button
                            type="button"
                            aria-label="Supprimer la section"
                            className={iconDeleteCls}
                            onClick={() => handleRemoveSection(sIndex)}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="space-y-3 border-l border-[var(--ink-200)] pl-3">
                        {section.rows.map((row, rIndex) => (
                            <div key={rIndex} className="grid grid-cols-12 items-end gap-2">
                                <div className="col-span-3">
                                    <MiniField label="ID">
                                        <TextField
                                            value={row.id}
                                            onChange={(e) => handleUpdateRow(sIndex, rIndex, 'id', e.target.value)}
                                            placeholder="id_unique"
                                            maxLength={200}
                                        />
                                    </MiniField>
                                </div>
                                <div className="col-span-4">
                                    <MiniField label="Option">
                                        <TextField
                                            value={row.title}
                                            onChange={(e) => handleUpdateRow(sIndex, rIndex, 'title', e.target.value)}
                                            placeholder="Ex. Burger"
                                            maxLength={24}
                                        />
                                    </MiniField>
                                </div>
                                <div className="col-span-4">
                                    <MiniField label="Description">
                                        <TextField
                                            value={row.description}
                                            onChange={(e) => handleUpdateRow(sIndex, rIndex, 'description', e.target.value)}
                                            placeholder="Courte description…"
                                            maxLength={72}
                                        />
                                    </MiniField>
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    <button
                                        type="button"
                                        aria-label="Supprimer l'option"
                                        className="grid h-9 w-9 place-items-center rounded-lg text-[var(--ink-400)] transition hover:text-[var(--status-danger)]"
                                        onClick={() => handleRemoveRow(sIndex, rIndex)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button type="button" className={dashedButtonCls} onClick={() => handleAddRow(sIndex)}>
                            <Plus className="h-3.5 w-3.5" />
                            Ajouter une option
                        </button>
                    </div>
                </div>
            ))}

            {sections.length === 0 && (
                <p className="text-[12px] text-[var(--ink-soft)]">Aucune section ajoutée.</p>
            )}
        </div>
    );
};
