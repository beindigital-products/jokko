'use client'
import { useState, forwardRef, useMemo } from 'react'
import { Check, X } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
    validatePhone,
    formatAsYouType,
    detectCountry,
    SUPPORTED_COUNTRIES,
    type PhoneValidationResult,
    type CountryCode,
} from '@/lib/contacts/validation'

interface PhoneInputProps {
    value?: string
    indicator?: CountryCode | null
    onChange?: (value: string, validation: PhoneValidationResult) => void
    onBlur?: () => void
    defaultCountry?: CountryCode
    placeholder?: string
    disabled?: boolean
    error?: string
    showValidation?: boolean
    className?: string
    id?: string
    name?: string
}

// Separate internal state for Country and National Number
// When `value` props changes (external update), we parse it.
// When User types, we format it and rebuild `value`.

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
    function PhoneInput(
        {
            value = '',
            onChange,
            onBlur,
            defaultCountry = 'SN',
            placeholder = '77 123 45 67',
            disabled,
            error,
            showValidation = true,
            className,
            id,
            name,
            indicator,
        },
        ref
    ) {
        const [selectedCountry, setSelectedCountry] = useState<CountryCode>(defaultCountry)
        const detectedCountry = useMemo(() => indicator || detectCountry(value), [indicator, value])
        const country = detectedCountry || selectedCountry
        const displayValue = useMemo(() => {
            if (!value) return ''

            const countryObj = SUPPORTED_COUNTRIES.find(c => c.code === country)
            let national = value

            if (countryObj) {
                const cleanVal = value.replace(/[^\d+]/g, '')
                const cleanDial = countryObj.dialCode.replace('+', '')

                if (cleanVal.startsWith(countryObj.dialCode)) {
                    national = cleanVal.substring(countryObj.dialCode.length)
                } else if (cleanVal.startsWith(cleanDial)) {
                    national = cleanVal.substring(cleanDial.length)
                } else if (('+' + cleanVal).startsWith(countryObj.dialCode)) {
                    national = cleanVal.substring(cleanDial.length)
                }
            }

            return formatAsYouType(national, country)
        }, [country, value])
        const validation = useMemo(
            () => (value ? validatePhone(value, { defaultCountry }) : null),
            [defaultCountry, value]
        )

        const currentCountryObj = SUPPORTED_COUNTRIES.find((c) => c.code === country);

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;

            // Limit to allowed chars (digits, maybe space)
            // But user might type arbitrary stuff, formatAsYouType handles clean up
            const formatted = formatAsYouType(raw, country);

            // Reconstruct full E.164
            const cleanDigits = formatted.replace(/\D/g, '');
            const prefix = currentCountryObj?.dialCode || '';
            const fullNumber = prefix + cleanDigits;

            const res = validatePhone(fullNumber, { defaultCountry: country });

            onChange?.(fullNumber, res);
        };

        const handleCountryChange = (code: string) => {
            const newCountry = code as CountryCode;
            setSelectedCountry(newCountry);

            // Reformat existing digits with new country format
            const cleanDigits = displayValue.replace(/\D/g, '');

            const newCountryObj = SUPPORTED_COUNTRIES.find(c => c.code === newCountry);
            const prefix = newCountryObj?.dialCode || '';
            const fullNumber = prefix + cleanDigits;

            const res = validatePhone(fullNumber, { defaultCountry: newCountry });

            onChange?.(fullNumber, res);
        };

        const showValid = showValidation && displayValue && validation?.valid
        const showInvalid = showValidation && displayValue && validation?.valid === false
        const hasError = !!error || showInvalid

        return (
            <div className={cn('space-y-1', className)}>
                <div className={cn(
                    // v3 tokens: paper-warm bg, ink-200 border, accent focus ring.
                    "flex h-11 w-full rounded-xl border border-[var(--ink-200)] bg-[var(--paper-warm)] focus-within:ring-2 focus-within:ring-[var(--accent-ring)] focus-within:border-[var(--accent)] overflow-hidden transition-colors",
                    hasError && "border-[var(--status-danger)] ring-[var(--status-danger)]/20"
                )}>
                    {/* Country Selector */}
                    <div className="flex-none border-r border-[var(--ink-200)]">
                        <Select value={country} onValueChange={handleCountryChange} disabled={disabled}>
                            <SelectTrigger className="h-full border-0 bg-transparent px-3 rounded-none shadow-none focus:ring-0 gap-1 w-[92px]">
                                <SelectValue>
                                    <span className="flex items-center gap-1.5">
                                        <span className="text-base leading-none">{currentCountryObj?.flag}</span>
                                        <span className="text-xs text-[var(--ink-500)]">{currentCountryObj?.dialCode}</span>
                                    </span>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {SUPPORTED_COUNTRIES.map((c) => (
                                    <SelectItem key={c.code} value={c.code}>
                                        <span className="flex items-center gap-2">
                                            <span>{c.flag}</span>
                                            <span>{c.name}</span>
                                            <span className="text-xs text-[var(--ink-500)]">{c.dialCode}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Input */}
                    <input
                        ref={ref}
                        id={id}
                        name={name}
                        type="tel"
                        value={displayValue}
                        onChange={handleInputChange}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="flex-1 bg-transparent px-3 text-sm text-[var(--ink-900)] focus:outline-none placeholder:text-[var(--ink-400)]"
                    />

                    {/* Validation Status */}
                    {showValidation && displayValue && (
                        <div className="flex items-center px-3">
                            {showValid ? (
                                <Check className="h-4 w-4 text-[var(--status-good)]" strokeWidth={2.5} />
                            ) : showInvalid ? (
                                <X className="h-4 w-4 text-[var(--status-danger)]" strokeWidth={2.5} />
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Error message */}
                {error && <p className="text-xs text-[var(--status-danger)]">{error}</p>}
            </div>
        )
    }
)
