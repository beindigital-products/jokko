import { useState, useMemo } from 'react';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { TemplateType, TemplateTypeConfig } from '@/convex/lib/templateTypes';
import { validateTemplate } from '@/convex/lib/templateValidation';
import type {
    ExistingTemplateData,
    TemplateCarouselEditorCard,
    TemplateFormData,
} from '@/components/templates/types';

interface UseTemplateBuilderProps {
    type: TemplateType;
    initialData?: ExistingTemplateData | null;
    onSuccess: () => void;
    config: TemplateTypeConfig;
}

export const useTemplateBuilder = ({
    type,
    initialData,
    onSuccess,
    config
}: UseTemplateBuilderProps) => {
    const createMutation = useMutation(api.templates.mutations.create);
    const updateMutation = useMutation(api.templates.mutations.update);
    const submitToMetaAction = useAction(api.templates.actions.submitToMeta);
    type CreateTemplateArgs = Parameters<typeof createMutation>[0];
    type UpdateTemplateArgs = Parameters<typeof updateMutation>[0];

    const [loading, setLoading] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [formData, setFormData] = useState<TemplateFormData>({
        name: initialData?.name || '',
        language: initialData?.language || 'fr',
        category: initialData?.category || 'MARKETING',
        body: initialData?.body || '',
        header: initialData?.header || (config.features.headerTypes.length > 0 ? { type: config.features.headerTypes[0] } : undefined),
        footer: initialData?.footer || '',
        buttons: initialData?.buttons || [],
        sections: initialData?.listConfig?.sections?.map((section) => ({
            title: section.title || '',
            rows: section.rows.map((row) => ({
                id: row.id,
                title: row.title,
                description: row.description || '',
            })),
        })) || [], // For LIST
        cards: initialData?.carouselCards?.map((c) => ({
            title: c.title,
            headerUrl: c.header?.mediaUrl,
            body: c.body,
            buttons: c.buttons
        })) || [],       // For CAROUSEL
    });

    const validationResult = useMemo(() => {
        // Construct the hypothetical payload for validation
        // We reuse the logic from submit() roughly
        const payload: CreateTemplateArgs = {
            name: formData.name,
            language: formData.language,
            category: formData.category,
            type: type,
            header: formData.header,
            body: formData.body,
            footer: formData.footer,
            buttons: formData.buttons,
        };
        // Add specific fields if needed for validation (LIST...)
        if (type === 'LIST') {
            payload.listConfig = {
                buttonText: formData.buttons?.[0]?.text || 'Menu',
                sections: formData.sections,
            };
        }

        return validateTemplate(payload);
    }, [formData, type]);

    const handleChange = <Field extends keyof TemplateFormData>(
        field: Field,
        value: TemplateFormData[Field],
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const submit = async () => {
        setLoading(true);
        try {
            // Transform data to match Schema
            const payload: CreateTemplateArgs = {
                name: formData.name,
                language: formData.language,
                category: formData.category,
                type: type,
                body: formData.body, // Default body for non-carousel
                footer: formData.footer,
            };

            // Handle Header
            if (formData.header && formData.header.type !== 'NONE') {
                payload.header = {
                    type: formData.header.type,
                    text: formData.header.text,
                    mediaUrl: formData.header.url,
                };
            }

            // Handle Buttons (Standard)
            if (config.features.hasButtons && type !== 'LIST' && type !== 'CAROUSEL') {
                payload.buttons = formData.buttons;
            }

            // Handle LIST
            if (type === 'LIST') {
                payload.listConfig = {
                    buttonText: formData.buttons?.[0]?.text || 'Menu',
                    sections: formData.sections
                };
                // List templates typically don't have a standard Body/Header/Footer in the same way? 
                // Actually they do have Header/Body/Footer. The list itself is the interaction.
            }

            // Handle CAROUSEL
            if (type === 'CAROUSEL') {
                // Carousel doesn't use the standard body/header/buttons fields
                delete payload.body;
                delete payload.header;
                delete payload.buttons;
                delete payload.footer; // Usually carousel doesn't have a main footer? check limits.

                payload.carouselCards = formData.cards.map((card: TemplateCarouselEditorCard) => ({
                    header: {
                        type: 'IMAGE', // Assuming image for now
                        mediaUrl: card.headerUrl
                    },
                    body: card.body,
                    buttons: card.buttons
                }));
            }

            if (initialData?._id) {
                await updateMutation({
                    id: initialData._id,
                    ...payload,
                } satisfies UpdateTemplateArgs);
            } else {
                await createMutation(payload);
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : String(error);
            alert("Erreur lors de l'enregistrement: " + message);
        } finally {
            setLoading(false);
        }
    };

    const publish = async () => {
        if (!initialData?._id) return;

        // Final Validation Check before publish
        if (!validationResult.valid) {
            alert("Veuillez corriger les erreurs avant d'envoyer à WhatsApp.");
            return;
        }

        if (validationResult.warnings.length > 0) {
            const confirm = window.confirm("Ce template contient des avertissements. Voulez-vous vraiment l'envoyer ? Il risque d'être rejeté.");
            if (!confirm) return;
        }

        setIsPublishing(true);
        try {
            await submitToMetaAction({ templateId: initialData._id });
            alert("Template envoyé pour validation à WhatsApp !");
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : String(error);
            alert("Erreur lors de l'envoi à WhatsApp: " + message);
        } finally {
            setIsPublishing(false);
        }
    };

    return {
        formData,
        loading,
        isPublishing,
        handleChange,
        submit,
        publish,
        validationResult
    };
};
