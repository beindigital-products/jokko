'use client'

import React from 'react';
import { TemplateType, TEMPLATE_TYPE_CONFIGS, SUPPORTED_LANGUAGES, HeaderType } from '@/convex/lib/templateTypes';
import { Loader2, Info, AlertTriangle, AlertCircle, CircleCheck, Send } from 'lucide-react';
import { TemplateButtonsBuilder } from './builders/TemplateButtonsBuilder';
import { TemplateListBuilder } from './builders/TemplateListBuilder';
import { TemplateCarouselBuilder } from './builders/TemplateCarouselBuilder';
import { useTemplateBuilder } from '@/hooks/useTemplateBuilder';
import { TEMPLATE_TYPE_ICONS } from '@/components/dashboard/templates/template-type-icons';
import { TemplateBuilderPreview } from '@/components/dashboard/templates/TemplateBuilderPreview';
import {
    Field,
    TextField,
    SelectField,
    TextareaField,
    VariableButton,
    FormSection,
    appendVariable,
} from '@/components/dashboard/templates/form-controls';
import { InlineAlert } from '@/components/dashboard/primitives/InlineAlert';
import type { ExistingTemplateData, TemplateHeaderData } from './types';

interface TemplateBuilderProps {
    type: TemplateType;
    initialData?: ExistingTemplateData | null;
    onSuccess: () => void;
    onCancel: () => void;
}

/** French label for each WhatsApp header attachment kind. */
const HEADER_LABELS: Record<string, string> = {
    NONE: 'Aucun',
    TEXT: 'Texte',
    IMAGE: 'Image',
    VIDEO: 'Vidéo',
    DOCUMENT: 'Document',
    LOCATION: 'Localisation',
};

/**
 * TemplateBuilder — the full-page editor for advanced template types (média,
 * liste, carrousel, catalogue, offres…) and for editing any existing template.
 * v3 "paper × ink × cobalt" surface, sharing the form controls and the
 * WhatsApp preview with the {@link TemplateCreateModal}.
 */
export const TemplateBuilder: React.FC<TemplateBuilderProps> = ({
    type,
    initialData,
    onSuccess,
    onCancel
}) => {
    const config = TEMPLATE_TYPE_CONFIGS[type];
    const TypeIcon = TEMPLATE_TYPE_ICONS[type];
    const { formData, loading, isPublishing, handleChange, submit, publish, validationResult } = useTemplateBuilder({
        type,
        initialData,
        onSuccess,
        config
    });

    const isReadOnly = initialData?.status === 'PENDING' || initialData?.status === 'APPROVED';
    const headerType = formData.header?.type || 'NONE';

    const updateHeader = (patch: Partial<TemplateHeaderData>) => {
        handleChange('header', {
            type: formData.header?.type || 'NONE',
            ...formData.header,
            ...patch,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submit();
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-7">
                {/* Status / validation banners */}
                {isReadOnly && (
                    <InlineAlert
                        tone={initialData?.status === 'APPROVED' ? 'good' : 'accent'}
                        icon={initialData?.status === 'APPROVED' ? CircleCheck : Info}
                        title={initialData?.status === 'APPROVED' ? 'Modèle validé' : 'En attente de validation'}
                        body={
                            initialData?.status === 'APPROVED'
                                ? 'Ce modèle est validé par WhatsApp et ne peut plus être modifié.'
                                : 'Ce modèle est en cours de validation par WhatsApp. Vous ne pouvez pas le modifier pour le moment.'
                        }
                    />
                )}

                {!isReadOnly && validationResult.errors.length > 0 && (
                    <InlineAlert
                        tone="danger"
                        icon={AlertCircle}
                        title="Erreurs bloquantes"
                        body={
                            <ul className="space-y-1">
                                {validationResult.errors.map((err, i) => (
                                    <li key={i} className="flex items-start gap-1.5">
                                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--status-danger)]" />
                                        {err}
                                    </li>
                                ))}
                            </ul>
                        }
                    />
                )}

                {!isReadOnly && validationResult.warnings.length > 0 && (
                    <InlineAlert
                        tone="warn"
                        icon={AlertTriangle}
                        title="Attention (risque de rejet)"
                        body={
                            <ul className="space-y-1">
                                {validationResult.warnings.map((warn, i) => (
                                    <li key={i} className="flex items-start gap-1.5">
                                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--status-warn)]" />
                                        {warn}
                                    </li>
                                ))}
                            </ul>
                        }
                    />
                )}

                {/* Main configuration card */}
                <div className="rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-5 sm:p-6">
                    <div className="flex items-center gap-3 border-b border-[var(--ink-100)] pb-4">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                            <TypeIcon className="h-5 w-5" strokeWidth={1.6} />
                        </span>
                        <div className="min-w-0">
                            <h2 className="font-display text-[16px] text-[var(--ink-900)]">{config.labelFr}</h2>
                            <p className="mt-0.5 truncate text-[12.5px] text-[var(--ink-soft)]">{config.descriptionFr}</p>
                        </div>
                    </div>

                    <fieldset disabled={isReadOnly} className="mt-5 space-y-5">
                        {/* Identity */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Field label="Nom du modèle" hint="Minuscules, chiffres et underscores uniquement.">
                                    <TextField
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                        placeholder="ex. welcome_message"
                                        maxLength={512}
                                    />
                                </Field>
                            </div>
                            <Field label="Langue">
                                <SelectField value={formData.language} onChange={(e) => handleChange('language', e.target.value)}>
                                    {SUPPORTED_LANGUAGES.map((lang) => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.native} ({lang.name})
                                        </option>
                                    ))}
                                </SelectField>
                            </Field>
                            <Field label="Catégorie">
                                <SelectField value={formData.category} onChange={(e) => handleChange('category', e.target.value)}>
                                    {config.categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </SelectField>
                            </Field>
                        </div>

                        {/* Header */}
                        {config.features.hasHeader && type !== 'CAROUSEL' && (
                            <FormSection>
                                <Field label="En-tête (header)">
                                    <SelectField
                                        value={headerType}
                                        onChange={(e) => updateHeader({ type: e.target.value as HeaderType })}
                                    >
                                        {config.features.headerTypes.map((t) => (
                                            <option key={t} value={t}>
                                                {HEADER_LABELS[t] ?? t}
                                            </option>
                                        ))}
                                    </SelectField>
                                </Field>

                                {headerType === 'TEXT' && (
                                    <div className="mt-2">
                                        <TextField
                                            value={formData.header?.text || ''}
                                            onChange={(e) => updateHeader({ text: e.target.value })}
                                            placeholder="Texte de l'en-tête"
                                            maxLength={60}
                                        />
                                    </div>
                                )}

                                {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType) && (
                                    <div className="mt-3">
                                        <Field
                                            label="URL du média"
                                            hint="Utilisez des variables (ex. {{1}}) pour rendre l'URL dynamique."
                                            action={
                                                <VariableButton onClick={() => updateHeader({ url: appendVariable(formData.header?.url || '') })} />
                                            }
                                        >
                                            <TextField
                                                value={formData.header?.url || ''}
                                                onChange={(e) => updateHeader({ url: e.target.value })}
                                                placeholder="https://exemple.com/image-{{1}}.jpg"
                                            />
                                        </Field>
                                    </div>
                                )}
                            </FormSection>
                        )}

                        {/* Body */}
                        {config.features.hasBody && (
                            <FormSection>
                                <Field
                                    label="Message principal (body)"
                                    action={<VariableButton onClick={() => handleChange('body', appendVariable(formData.body || ''))} />}
                                >
                                    <TextareaField
                                        value={formData.body}
                                        onChange={(e) => handleChange('body', e.target.value)}
                                        placeholder="Votre message… Utilisez {{1}}, {{2}} pour les variables."
                                        className="h-32"
                                    />
                                </Field>
                            </FormSection>
                        )}

                        {/* Footer */}
                        {config.features.hasFooter && type !== 'CAROUSEL' && (
                            <FormSection>
                                <Field label="Pied de page (footer)">
                                    <TextField
                                        value={formData.footer}
                                        onChange={(e) => handleChange('footer', e.target.value)}
                                        placeholder="Texte gris en bas du message"
                                        maxLength={60}
                                    />
                                </Field>
                            </FormSection>
                        )}

                        {/* LIST builder */}
                        {type === 'LIST' && (
                            <FormSection className="space-y-4">
                                <Field label="Bouton du menu">
                                    <TextField
                                        value={formData.buttons?.[0]?.text || ''}
                                        onChange={(e) => {
                                            const newButtons = [...(formData.buttons || [])];
                                            if (!newButtons[0]) newButtons[0] = { type: 'QUICK_REPLY', text: '' };
                                            newButtons[0] = { ...newButtons[0], text: e.target.value };
                                            handleChange('buttons', newButtons);
                                        }}
                                        placeholder="Ex. Afficher le menu"
                                        maxLength={20}
                                    />
                                </Field>
                                <TemplateListBuilder
                                    sections={formData.sections || []}
                                    onChange={(sections) => handleChange('sections', sections)}
                                />
                            </FormSection>
                        )}

                        {/* CAROUSEL builder */}
                        {type === 'CAROUSEL' && (
                            <FormSection>
                                <TemplateCarouselBuilder
                                    cards={formData.cards || []}
                                    onChange={(cards) => handleChange('cards', cards)}
                                />
                            </FormSection>
                        )}

                        {/* Standard buttons */}
                        {config.features.hasButtons && type !== 'LIST' && type !== 'CAROUSEL' && (
                            <FormSection>
                                <TemplateButtonsBuilder
                                    buttons={formData.buttons || []}
                                    onChange={(btns) => handleChange('buttons', btns)}
                                    allowedTypes={config.features.buttonTypes}
                                    maxButtons={config.features.maxButtons}
                                />
                            </FormSection>
                        )}
                    </fieldset>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-warm)]/50 px-5 py-3.5">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading || isPublishing}
                        className="inline-flex h-9 items-center rounded-lg px-3 text-[13px] font-medium text-[var(--ink-500)] transition hover:bg-[var(--paper-warm)] hover:text-[var(--ink-700)] disabled:opacity-50"
                    >
                        Annuler
                    </button>

                    {!isReadOnly && (
                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                disabled={loading || isPublishing}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 text-[13px] font-medium text-[var(--ink-700)] transition hover:bg-[var(--paper-warm)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                {initialData ? 'Enregistrer le brouillon' : 'Créer le brouillon'}
                            </button>

                            {initialData && (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await publish();
                                        onSuccess();
                                    }}
                                    disabled={loading || isPublishing}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--ink-900)] px-4 text-[13px] font-medium text-white transition hover:bg-[var(--ink-700)] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isPublishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                    Soumettre pour approbation
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview column */}
            <div className="lg:col-span-5">
                <div className="sticky top-6 rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-warm)] p-5">
                    <TemplateBuilderPreview
                        data={{
                            header: formData.header,
                            body: formData.body,
                            footer: formData.footer,
                            buttons: formData.buttons,
                            sections: formData.sections,
                            cards: formData.cards,
                        }}
                        config={config}
                    />
                </div>
            </div>
        </form>
    );
};
