'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowRight, CheckIcon, XIcon, AlertCircle, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PhoneInput } from '@/components/contacts/PhoneInput';
import { cn } from '@/lib/utils';

import {
    businessInfoSchema,
    type BusinessInfoData,
    BUSINESS_SECTORS,
    TIMEZONES,
    LANGUAGES,
} from '@/lib/onboarding/steps';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface BusinessInfoStepProps {
    onComplete: () => void;
}

export function BusinessInfoStep({ onComplete }: BusinessInfoStepProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<BusinessInfoData>({
        resolver: zodResolver(businessInfoSchema),
        defaultValues: {
            businessName: '',
            slug: '',
            businessWebsite: '',
            businessPhone: '',
            timezone: 'UTC',
            locale: 'fr',
        },
    });

    const createOrg = useMutation(api.organizations.create);

    const slug = form.watch('slug');
    const checkSlug = useQuery(api.organizations.checkSlug, slug && slug.length >= 3 ? { slug } : "skip");
    const [slugStatus, setSlugStatus] = useState<'checking' | 'available' | 'taken' | null>(null);

    useEffect(() => {
        if (!slug || slug.length < 3) {
            setSlugStatus(null);
            return;
        }

        if (checkSlug === undefined) {
            setSlugStatus('checking');
            return;
        }

        const timer = setTimeout(() => {
            setSlugStatus(checkSlug ? 'available' : 'taken');
        }, 300);

        return () => clearTimeout(timer);
    }, [slug, checkSlug]);

    // Slug suggestions shown when the chosen slug is taken (per PDF spec).
    // Pure client-side guesses — backend `checkSlug` is the authority on whether
    // any given suggestion is actually free; user has to click + retry.
    const slugSuggestions = useMemo(() => {
        if (!slug || slug.length < 3) return [];
        const base = slug.replace(/-+$/, '');
        return [`${base}-2`, `${base}-app`, `${base}-pro`];
    }, [slug]);

    async function onSubmit(values: BusinessInfoData) {
        setIsLoading(true);
        setError(null);

        if (slugStatus === 'taken') {
            setError("Le slug choisi est déjà pris. Veuillez en choisir un autre.");
            setIsLoading(false);
            return;
        }

        try {
            await createOrg({
                name: values.businessName,
                slug: values.slug,
                businessSector: values.businessSector,
                website: values.businessWebsite || undefined,
                phone: values.businessPhone || undefined,
                timezone: values.timezone,
                locale: values.locale,
            });

            onComplete();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setIsLoading(false);
        }
    }

    const inputClass = "h-11 rounded-xl border-[var(--ink-200)] bg-[var(--paper-warm)] focus-visible:bg-white focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent-ring)] transition-colors";
    const selectTriggerClass = "h-11 rounded-xl border-[var(--ink-200)] bg-[var(--paper-warm)] data-[state=open]:bg-white hover:bg-white focus:bg-white focus:border-[var(--accent)] focus:ring-[var(--accent-ring)] transition-colors";

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium text-[var(--ink-700)]">
                                Nom de l&apos;entreprise <span className="text-[var(--accent)]">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Mission Impastabowl"
                                    disabled={isLoading}
                                    className={inputClass}
                                    {...field}
                                    onChange={(e) => {
                                        field.onChange(e);
                                        const slug = e.target.value
                                            .toLowerCase()
                                            .replace(/\s+/g, '-')
                                            .replace(/[^a-z0-9-]/g, '');
                                        form.setValue('slug', slug);
                                    }}
                                />
                            </FormControl>
                            <FormDescription className="text-xs text-[var(--ink-500)]">
                                Le nom affiché dans vos conversations WhatsApp.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-baseline justify-between gap-3">
                                <FormLabel className="text-sm font-medium text-[var(--ink-700)]">
                                    Slug Jokko <span className="text-[var(--accent)]">*</span>
                                </FormLabel>
                                {/* v3 — preview the resulting tenant URL top-right, mono.
                                    Sub-domain pattern per Q4=(a) → {slug}.jokko.com. */}
                                <span className="font-mono text-[11px] text-[var(--ink-soft)]">
                                    {field.value ? `${field.value}.jokko.com` : "mon-entreprise.jokko.com"}
                                </span>
                            </div>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        placeholder="mon-entreprise"
                                        disabled={isLoading}
                                        aria-describedby="slug-status"
                                        className={cn(
                                            inputClass,
                                            // Reserve room on the right for the inline chip.
                                            slugStatus ? "pr-36" : "pr-3",
                                            slugStatus === 'taken' && "border-[var(--status-danger)] focus-visible:border-[var(--status-danger)]",
                                        )}
                                        {...field}
                                        onChange={(e) => {
                                            const value = e.target.value
                                                .toLowerCase()
                                                .replace(/\s+/g, '-')
                                                .replace(/[^a-z0-9-]/g, '');
                                            field.onChange(value);
                                        }}
                                    />
                                    {/* Inline status chip — Vérification… / Disponible / Déjà utilisé.
                                        aria-live polite so the chip change is announced to AT users
                                        (User Advocate review point). */}
                                    {slugStatus ? (
                                        <span
                                            id="slug-status"
                                            aria-live="polite"
                                            className={cn(
                                                "absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium",
                                                slugStatus === 'available' && "bg-[var(--status-good-soft)] text-[var(--status-good)]",
                                                slugStatus === 'taken' && "bg-[var(--status-danger-soft)] text-[var(--status-danger)]",
                                                slugStatus === 'checking' && "bg-[var(--paper-warm)] text-[var(--ink-500)]",
                                            )}
                                        >
                                            {slugStatus === 'checking' && <><Sparkles className="h-3 w-3" /> Vérification…</>}
                                            {slugStatus === 'available' && <><CheckIcon className="h-3 w-3" strokeWidth={2.5} /> Disponible</>}
                                            {slugStatus === 'taken' && <><XIcon className="h-3 w-3" strokeWidth={2.5} /> Déjà utilisé</>}
                                        </span>
                                    ) : null}
                                </div>
                            </FormControl>
                            {slugStatus === 'taken' && slugSuggestions.length > 0 ? (
                                <p className="mt-1.5 text-xs text-[var(--status-danger)]">
                                    Ce nom est pris. Essayez{' '}
                                    {slugSuggestions.slice(0, 2).map((suggestion, idx) => (
                                        <span key={suggestion}>
                                            <button
                                                type="button"
                                                onClick={() => form.setValue('slug', suggestion)}
                                                className="font-mono rounded bg-[var(--accent-muted)] px-1.5 py-0.5 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors"
                                            >
                                                {suggestion}
                                            </button>
                                            {idx === 0 ? ' ou ' : ''}
                                        </span>
                                    ))}
                                    .
                                </p>
                            ) : null}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* 2-col row : Secteur (left) + Site web (right). v3 layout */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="businessSector"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-[var(--ink-700)]">
                                    Secteur d&apos;activité <span className="text-[var(--accent)]">*</span>
                                </FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger className={selectTriggerClass}>
                                            <SelectValue placeholder="Choisir un secteur" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {BUSINESS_SECTORS.map((sector) => (
                                            <SelectItem key={sector.value} value={sector.value}>
                                                <div className="flex items-center gap-2">
                                                    <sector.icon className="h-4 w-4 text-[var(--ink-500)]" />
                                                    <span>{sector.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="businessWebsite"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-[var(--ink-700)]">
                                    Site web <span className="text-[var(--ink-400)] text-xs font-normal">(optionnel)</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="url"
                                        placeholder="https://"
                                        disabled={isLoading}
                                        className={inputClass}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* 2-col row : Téléphone (PhoneInput w/ country picker) + Fuseau horaire */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="businessPhone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-[var(--ink-700)]">
                                    Téléphone entreprise <span className="text-[var(--ink-400)] text-xs font-normal">(optionnel)</span>
                                </FormLabel>
                                <FormControl>
                                    <PhoneInput
                                        value={field.value || ''}
                                        defaultCountry="SN"
                                        showValidation={false}
                                        disabled={isLoading}
                                        onChange={(value) => field.onChange(value)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="timezone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-[var(--ink-700)]">
                                    Fuseau horaire
                                </FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger className={selectTriggerClass}>
                                            <SelectValue placeholder="Sélectionnez" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {TIMEZONES.map((tz) => (
                                            <SelectItem key={tz.value} value={tz.value}>
                                                {tz.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Langue alone on a half-row per PDF */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="locale"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-[var(--ink-700)]">
                                    Langue
                                </FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger className={selectTriggerClass}>
                                            <SelectValue placeholder="Sélectionnez" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {LANGUAGES.map((lang) => (
                                            <SelectItem key={lang.value} value={lang.value}>
                                                {lang.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {error ? (
                    <Alert variant="destructive" className="border-[var(--status-danger)]/30 bg-[var(--status-danger-soft)]">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-[var(--status-danger)]">{error}</AlertDescription>
                    </Alert>
                ) : null}

                {/* v3 action row : hint left, compact button right. Divider above
                    separates form from CTA. */}
                <div className="border-t border-[var(--ink-200)] pt-5 flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-xs text-[var(--ink-500)]">
                        <span className="text-[var(--accent)]">*</span> Champs obligatoires
                    </p>
                    <Button
                        type="submit"
                        variant="accent"
                        disabled={isLoading || slugStatus === 'taken' || slugStatus === 'checking'}
                        className="group"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Continuer
                                <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
