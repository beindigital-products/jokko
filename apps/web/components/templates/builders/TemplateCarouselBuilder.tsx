import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

import {
    Field,
    TextField,
    TextareaField,
    VariableButton,
    appendVariable,
} from '@/components/dashboard/templates/form-controls';
import { TemplateButtonsBuilder } from './TemplateButtonsBuilder';
import type { TemplateCarouselEditorCard } from '../types';

interface TemplateCarouselBuilderProps {
    cards: TemplateCarouselEditorCard[];
    onChange: (cards: TemplateCarouselEditorCard[]) => void;
}

const MAX_CARDS = 10;

export const TemplateCarouselBuilder: React.FC<TemplateCarouselBuilderProps> = ({
    cards = [],
    onChange,
}) => {
    const handleAddCard = () => {
        if (cards.length < MAX_CARDS) {
            onChange([...cards, { title: '', body: '', buttons: [] }]);
        }
    };

    const handleRemoveCard = (index: number) => {
        onChange(cards.filter((_, i) => i !== index));
    };

    const handleUpdateCard = <Field extends keyof TemplateCarouselEditorCard>(
        index: number,
        field: Field,
        value: TemplateCarouselEditorCard[Field],
    ) => {
        const newCards = [...cards];
        newCards[index] = { ...newCards[index], [field]: value };
        onChange(newCards);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[var(--ink-700)]">
                    Cartes du carrousel{' '}
                    <span className="font-normal text-[var(--ink-soft)]">
                        ({cards.length}/{MAX_CARDS})
                    </span>
                </span>
                {cards.length < MAX_CARDS && (
                    <button
                        type="button"
                        onClick={handleAddCard}
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[var(--accent)] transition hover:bg-[var(--accent-muted)]"
                    >
                        <Plus className="h-3 w-3" />
                        Ajouter une carte
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {cards.map((card, index) => (
                    <div key={index} className="space-y-3 rounded-xl border border-[var(--ink-200)] bg-[var(--paper-warm)] p-4">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                                Carte {index + 1}
                            </span>
                            <button
                                type="button"
                                aria-label="Supprimer la carte"
                                onClick={() => handleRemoveCard(index)}
                                className="grid h-7 w-7 place-items-center rounded-lg text-[var(--ink-400)] transition hover:text-[var(--status-danger)]"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <Field label="Titre (optionnel)">
                            <TextField
                                value={card.title || ''}
                                onChange={(e) => handleUpdateCard(index, 'title', e.target.value)}
                                placeholder="Titre en gras…"
                            />
                        </Field>

                        <Field
                            label="URL média (image / vidéo)"
                            hint="Supporte les variables {{1}}."
                            action={<VariableButton onClick={() => handleUpdateCard(index, 'headerUrl', appendVariable(card.headerUrl || ''))} />}
                        >
                            <TextField
                                value={card.headerUrl || ''}
                                onChange={(e) => handleUpdateCard(index, 'headerUrl', e.target.value)}
                                placeholder="https://exemple.com/media-{{1}}.jpg"
                            />
                        </Field>

                        <Field
                            label="Contenu (body)"
                            action={
                                <VariableButton onClick={() => handleUpdateCard(index, 'body', appendVariable(card.body || ''))} />
                            }
                        >
                            <TextareaField
                                value={card.body}
                                onChange={(e) => handleUpdateCard(index, 'body', e.target.value)}
                                placeholder="Description de la carte…"
                                maxLength={160}
                                className="h-20"
                            />
                        </Field>

                        <div className="border-t border-[var(--ink-100)] pt-3">
                            <TemplateButtonsBuilder
                                buttons={card.buttons}
                                onChange={(btns) => handleUpdateCard(index, 'buttons', btns)}
                                allowedTypes={['QUICK_REPLY', 'URL', 'PHONE_NUMBER']}
                                maxButtons={2}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {cards.length === 0 && (
                <div className="rounded-xl border border-dashed border-[var(--ink-200)] py-8 text-center text-[12.5px] text-[var(--ink-soft)]">
                    Aucune carte. Ajoutez votre première carte pour le carrousel.
                </div>
            )}
        </div>
    );
};
