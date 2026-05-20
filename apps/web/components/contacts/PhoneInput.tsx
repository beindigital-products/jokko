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
                    "flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 overflow-hidden",
                    hasError && "border-destructive ring-destructive/20"
                )}>
                    {/* Country Selector */}
                    <div className="flex-none border-r border-gray-200 bg-gray-50/50">
                        <Select value={country} onValueChange={handleCountryChange} disabled={disabled}>
                            <SelectTrigger className="h-full border-0 bg-transparent px-3 rounded-none shadow-none focus:ring-0 gap-2 w-[100px]">
                                <SelectValue>
                                    <span className="flex items-center gap-1">
                                        <span className="text-lg leading-none">{currentCountryObj?.flag}</span>
                                        <span className="text-xs text-muted-foreground">{currentCountryObj?.dialCode}</span>
                                    </span>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {SUPPORTED_COUNTRIES.map((c) => (
                                    <SelectItem key={c.code} value={c.code}>
                                        <span className="flex items-center gap-2">
                                            <span>{c.flag}</span>
                                            <span>{c.name}</span>
                                            <span className="text-xs text-muted-foreground">{c.dialCode}</span>
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
                        className="flex-1 bg-transparent px-3 text-sm focus:outline-none placeholder:text-muted-foreground"
                    />

                    {/* Validation Status */}
                    {showValidation && displayValue && (
                        <div className="flex items-center px-3">
                            {showValid ? (
                                <Check className="h-4 w-4 text-green-500" />
                            ) : showInvalid ? (
                                <X className="h-4 w-4 text-destructive" />
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Error message */}
                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
        )
    }
)
