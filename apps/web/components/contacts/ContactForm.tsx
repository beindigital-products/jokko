'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    User,
    Mail,
    Building2,
    MapPin,
    Tag,
    FileText,
    Loader2,
    ExternalLink,
    Lock,
    X,
} from 'lucide-react';
import { useState } from 'react';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from './PhoneInput';
import { detectCountry } from '@/lib/contacts/validation';
import { useCrmLink } from '@/hooks/use-crm-link';
import type { ComponentProps, ReactNode } from 'react';

// v3 field styles — shared by inputs/textareas (Cobalt × paper × ink).
const v3FieldClass =
    'h-9 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 text-[13px] text-[var(--ink-900)] shadow-none placeholder:text-[var(--ink-400)] focus-visible:border-[var(--accent)] focus-visible:ring-0';
const v3LabelClass = 'text-[12px] font-medium text-[var(--ink-700)]';

// Helper to wrap input with icon
function InputWithIcon({ leftIcon, className, ...props }: ComponentProps<typeof Input> & { leftIcon?: ReactNode }) {
    return (
        <div className="relative">
            {leftIcon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] pointer-events-none">
                    {leftIcon}
                </div>
            )}
            <Input className={`${v3FieldClass} pl-9 ${className ?? ''}`} {...props} />
        </div>
    );
}


const formSchema = z.object({
    phone: z.string().min(8, "Numéro requis"),
    name: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email("Email invalide").optional().or(z.literal('')),
    company: z.string().optional(),
    jobTitle: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    notes: z.string().optional(),

    // tags handled separately in state, or part of form?
    // reference form handles tags in state `const [tags, setTags]`.
});

export type ContactFormValues = z.infer<typeof formSchema>;

export interface ContactNote {
    authorName?: string;
    createdAt: number;
    content: string;
}

type NullableString = string | null | undefined;

export interface ContactFormInitialData {
    id?: string;
    phone?: NullableString;
    name?: NullableString;
    firstName?: NullableString;
    lastName?: NullableString;
    email?: NullableString;
    company?: NullableString;
    jobTitle?: NullableString;
    address?: NullableString;
    city?: NullableString;
    country?: NullableString;
    tags?: string[] | string | null;
    notes?: string | ContactNote[] | null;
}

export type ContactFormSubmitData = Omit<ContactFormValues, 'notes'> & {
    tags: string[];
    notes?: string;
    addNote?: string;
};

interface ContactFormProps {
    initialData?: ContactFormInitialData;
    mode: 'create' | 'edit';
    tags: string[]; // Available tags for autocomplete? Reference form only shows tags in badges.
    onSubmit: (data: ContactFormSubmitData) => Promise<void>;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function ContactForm({
    initialData,
    mode,
    onSubmit,
    isLoading,
    onCancel
}: ContactFormProps) {

    const crmLink = useCrmLink(mode === 'edit' ? initialData?.id : null);
    const isCrmLinked = !!crmLink;

    // Extract tags from initialData if present
    const initialTags = initialData?.tags
        ? (Array.isArray(initialData.tags) ? initialData.tags : initialData.tags.split(',').map((t: string) => t.trim()))
        : [];

    const [tags, setTags] = useState<string[]>(initialTags);
    const [tagInput, setTagInput] = useState('');

    // Handle initial notes
    const existingNotes: ContactNote[] = Array.isArray(initialData?.notes) ? initialData.notes : [];
    const initialNoteValue = typeof initialData?.notes === 'string' ? initialData.notes : '';

    // Logic to split the name if firstName and lastName are missing but name exists.
    let initialFirstName = initialData?.firstName || '';
    let initialLastName = initialData?.lastName || '';

    if (!initialFirstName && !initialLastName && initialData?.name) {
        const parts = initialData.name.trim().split(' ');
        if (parts.length > 0) {
            initialFirstName = parts[0];
            initialLastName = parts.slice(1).join(' '); // Remainder as last name
        }
    }

    const defaultValues = {
        phone: initialData?.phone || '',
        firstName: initialFirstName,
        lastName: initialLastName,
        email: initialData?.email || '',
        company: initialData?.company || '',
        jobTitle: initialData?.jobTitle || '',
        address: initialData?.address || '',
        city: initialData?.city || '',
        country: initialData?.country || '',
        notes: mode === 'create' ? initialNoteValue : '', // Empty for edit mode (add new note)
    };

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = tagInput.trim();
            if (val && !tags.includes(val)) {
                setTags([...tags, val]);
                setTagInput('');
            }
        }
    }

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    }

    const handleSubmit = async (values: ContactFormValues) => {
        const payload: ContactFormSubmitData = {
            ...values,
            tags
        };

        if (mode === 'edit') {
            // For edit mode, 'notes' field in form is actually for adding a new note
            const { notes, ...withoutNotes } = payload;
            await onSubmit({
                ...withoutNotes,
                ...(notes ? { addNote: notes } : {}),
            });
            return;
        }

        await onSubmit(payload);
    };

    const coreDisabled = isLoading || isCrmLinked;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
                <div>
                    <div className="space-y-4">
                        {isCrmLinked && crmLink && (
                            <div className="flex flex-col gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] p-3 text-[13px] text-[var(--ink-700)]">
                                <div className="flex items-center gap-2 font-medium text-[var(--ink-900)]">
                                    <Lock className="h-4 w-4 text-[var(--ink-400)]" />
                                    Contact synchronisé avec {crmLink.providerLabel}
                                </div>
                                <p className="text-[12px] leading-snug text-[var(--ink-soft)]">
                                    Les informations principales sont gérées dans {crmLink.providerLabel}.
                                    Vous pouvez ajouter des tags ou des notes locales côté Jokko.
                                </p>
                                {crmLink.externalUrl && (
                                    <a
                                        href={crmLink.externalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex w-fit items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5 py-1 text-[12px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)]"
                                    >
                                        Éditer dans {crmLink.providerLabel}
                                        <ExternalLink className="h-3 w-3 text-[var(--ink-400)]" />
                                    </a>
                                )}
                            </div>
                        )}
                        {/* Phone */}
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field, fieldState }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className={v3LabelClass}>Téléphone *</FormLabel>
                                    <FormControl>
                                        <PhoneInput
                                            indicator={detectCountry(field.value)}
                                            value={field.value}
                                            onChange={(val) => field.onChange(val)}
                                            onBlur={field.onBlur}
                                            error={fieldState.error?.message}
                                            disabled={coreDisabled}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-[12px] text-[var(--ink-soft)]">
                                        Format international recommandé pour WhatsApp
                                    </FormDescription>
                                </FormItem>
                            )}
                        />

                        {/* Name fields */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className={v3LabelClass}>Prénom</FormLabel>
                                        <FormControl>
                                            <InputWithIcon
                                                placeholder="Amadou"
                                                leftIcon={<User className="h-4 w-4" />}
                                                disabled={coreDisabled}
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className={v3LabelClass}>Nom</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Diallo"
                                                className={v3FieldClass}
                                                disabled={coreDisabled}
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Email */}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className={v3LabelClass}>Email</FormLabel>
                                    <FormControl>
                                        <InputWithIcon
                                            type="email"
                                            placeholder="amadou@example.com"
                                            leftIcon={<Mail className="h-4 w-4" />}
                                            disabled={coreDisabled}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[12px] text-[var(--status-danger)]" />
                                </FormItem>
                            )}
                        />

                        {/* Company fields */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="company"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className={v3LabelClass}>Entreprise</FormLabel>
                                        <FormControl>
                                            <InputWithIcon
                                                placeholder="Jokko SAS"
                                                leftIcon={<Building2 className="h-4 w-4" />}
                                                disabled={coreDisabled}
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="jobTitle"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className={v3LabelClass}>Fonction</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Directeur commercial"
                                                className={v3FieldClass}
                                                disabled={coreDisabled}
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Address fields */}
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className={v3LabelClass}>Adresse</FormLabel>
                                    <FormControl>
                                        <InputWithIcon
                                            placeholder="123 Rue de Dakar"
                                            leftIcon={<MapPin className="h-4 w-4" />}
                                            disabled={coreDisabled}
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className={v3LabelClass}>Ville</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Dakar"
                                                className={v3FieldClass}
                                                disabled={coreDisabled}
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className={v3LabelClass}>Pays</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Sénégal"
                                                className={v3FieldClass}
                                                disabled={coreDisabled}
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Tags */}
                        <div className="space-y-1.5">
                            <label className={`flex items-center gap-1.5 ${v3LabelClass}`}>
                                <Tag className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                                Tags
                            </label>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 pb-1">
                                    {tags.map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="group inline-flex items-center gap-1 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-2 py-0.5 text-[12px] text-[var(--ink-700)] transition-colors hover:border-[var(--status-danger)] hover:text-[var(--status-danger)]"
                                        >
                                            {tag}
                                            <X className="h-3 w-3 text-[var(--ink-400)] group-hover:text-[var(--status-danger)]" />
                                        </button>
                                    ))}
                                </div>
                            )}
                            <Input
                                placeholder="Ajouter un tag (Entrée pour valider)"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                disabled={isLoading}
                                className={v3FieldClass}
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <label className={`flex items-center gap-1.5 ${v3LabelClass}`}>
                                <FileText className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                                Notes
                            </label>

                            {/* Existing Notes Display */}
                            {existingNotes.length > 0 && (
                                <div className="mb-1 max-h-40 space-y-2 overflow-y-auto rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] p-2.5">
                                    {existingNotes.map((note, i) => (
                                        <div key={i} className="border-b border-[var(--ink-100)] pb-1.5 text-[12px] last:border-0 last:pb-0">
                                            <div className="flex justify-between text-[var(--ink-soft)]">
                                                <span>{note.authorName || 'Agent'}</span>
                                                <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-[var(--ink-700)]">{note.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormControl>
                                            <Textarea
                                                placeholder={mode === 'create' ? "Notes sur le contact..." : "Ajouter une nouvelle note..."}
                                                className="min-h-[100px] rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-2 text-[13px] text-[var(--ink-900)] shadow-none placeholder:text-[var(--ink-400)] focus-visible:border-[var(--accent)] focus-visible:ring-0"
                                                disabled={isLoading}
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                    </div>

                    <div className="mt-6 flex justify-end gap-2 border-t border-[var(--ink-200)] bg-[var(--paper-warm)]/40 -mx-6 -mb-6 px-6 py-3.5">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={isLoading}
                                className="rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[13px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)] disabled:opacity-60"
                            >
                                Annuler
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[var(--ink-700)] disabled:opacity-60"
                        >
                            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {isLoading
                                ? (mode === 'create' ? 'Création…' : 'Enregistrement…')
                                : (mode === 'create' ? 'Créer le contact' : 'Enregistrer')}
                        </button>
                    </div>
                </div>
            </form>
        </Form>
    );
}

export default ContactForm;
