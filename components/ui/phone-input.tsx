'use client'

import * as React from 'react'
import PhoneInputPrimitive, { type Country } from 'react-phone-number-input'
import flags from 'react-phone-number-input/flags'
import 'react-phone-number-input/style.css'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

type PhoneInputProps = Omit<
    React.ComponentProps<typeof PhoneInputPrimitive>,
    'onChange'
> & {
    onChange?: (value: string) => void
}

function PhoneInput({ className, onChange, ...props }: PhoneInputProps) {
    return (
        <PhoneInputPrimitive
            flags={flags}
            defaultCountry={'BR' as Country}
            international
            inputComponent={Input}
            onChange={(value) => onChange?.(value ?? '')}
            className={cn(
                // container
                'flex h-9 w-full rounded-md border border-input bg-transparent shadow-xs',
                // flag + select
                '[&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:gap-1 [&_.PhoneInputCountry]:pl-3 [&_.PhoneInputCountry]:pr-1',
                '[&_.PhoneInputCountrySelect]:cursor-pointer [&_.PhoneInputCountrySelect]:bg-transparent [&_.PhoneInputCountrySelect]:text-sm [&_.PhoneInputCountrySelect]:outline-none',
                '[&_.PhoneInputCountrySelectArrow]:opacity-50',
                // input field (remove default border pois o container já tem)
                '[&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:px-3 [&_input]:py-1 [&_input]:text-sm [&_input]:shadow-none [&_input]:outline-none [&_input]:ring-0 [&_input]:placeholder:text-muted-foreground',
                '[&_input:disabled]:cursor-not-allowed [&_input:disabled]:opacity-50',
                // focus ring no container
                'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
                className,
            )}
            {...props}
        />
    )
}

export { PhoneInput }
