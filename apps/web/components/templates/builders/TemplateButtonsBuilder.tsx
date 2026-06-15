import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { ButtonType } from '@/convex/lib/templateTypes';
import { TextField, SelectField } from '@/components/dashboard/templates/form-controls';
import type { TemplateButtonData } from '../types';

interface TemplateButtonsBuilderProps {
    buttons: TemplateButtonData[];
    onChange: (buttons: TemplateButtonData[]) => void;
    allowedTypes: ButtonType[];
    maxButtons: number;
}

/** French label for each WhatsApp button kind. */
const BUTTON_LABELS: Record<string, string> = {
    QUICK_REPLY: 'Réponse rapide',
    URL: 'Lien URL',
    PHONE_NUMBER: 'Appel téléphone',
    COPY_CODE: 'Copier le code',
    VOICE_CALL: 'Appel vocal',
    CATALOG: 'Catalogue',
    MPM: 'Multi-produits',
    SPM: 'Produit',
    OTP: 'Code OTP',
};

export const TemplateButtonsBuilder: React.FC<TemplateButtonsBuilderProps> = ({
    buttons,
    onChange,
    allowedTypes,
    maxButtons,
}) => {
    const handleAddButton = () => {
        if (buttons.length < maxButtons) {
            onChange([...buttons, { type: allowedTypes[0], text: '' }]);
        }
    };

    const handleRemoveButton = (index: number) => {
        onChange(buttons.filter((_, i) => i !== index));
    };

    const handleUpdateButton = <Field extends keyof TemplateButtonData>(
        index: number,
        field: Field,
        value: TemplateButtonData[Field],
    ) => {
        const newButtons = [...buttons];
        newButtons[index] = { ...newButtons[index], [field]: value };
        onChange(newButtons);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[var(--ink-700)]">
                    Boutons{' '}
                    <span className="font-normal text-[var(--ink-soft)]">
                        ({buttons.length}/{maxButtons})
                    </span>
                </span>
                {buttons.length < maxButtons && (
                    <button
                        type="button"
                        onClick={handleAddButton}
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[var(--accent)] transition hover:bg-[var(--accent-muted)]"
                    >
                        <Plus className="h-3 w-3" />
                        Ajouter
                    </button>
                )}
            </div>

            <div className="space-y-2">
                {buttons.map((btn, index) => (
                    <div key={index} className="space-y-2">
                        <div className="flex items-center gap-2">
                            <SelectField
                                value={btn.type}
                                onChange={(e) => handleUpdateButton(index, 'type', e.target.value as ButtonType)}
                                className="w-[140px] shrink-0"
                            >
                                {allowedTypes.map((t) => (
                                    <option key={t} value={t}>
                                        {BUTTON_LABELS[t] ?? t}
                                    </option>
                                ))}
                            </SelectField>
                            <TextField
                                value={btn.text}
                                onChange={(e) => handleUpdateButton(index, 'text', e.target.value)}
                                placeholder="Libellé du bouton"
                                maxLength={25}
                            />
                            <button
                                type="button"
                                aria-label="Supprimer le bouton"
                                onClick={() => handleRemoveButton(index)}
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--ink-200)] text-[var(--ink-400)] transition hover:bg-[var(--paper-warm)] hover:text-[var(--status-danger)]"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {btn.type === 'URL' && (
                            <TextField
                                value={btn.url || ''}
                                onChange={(e) => handleUpdateButton(index, 'url', e.target.value)}
                                placeholder="https://exemple.com"
                            />
                        )}

                        {btn.type === 'PHONE_NUMBER' && (
                            <TextField
                                value={btn.phoneNumber || ''}
                                onChange={(e) => handleUpdateButton(index, 'phoneNumber', e.target.value)}
                                placeholder="+221 77 123 45 67"
                            />
                        )}
                    </div>
                ))}

                {buttons.length === 0 && (
                    <p className="text-[12px] text-[var(--ink-soft)]">Aucun bouton ajouté.</p>
                )}
            </div>
        </div>
    );
};
