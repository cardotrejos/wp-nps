import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const COUNTRY_CODES = [
  { code: "+55", country: "BR", flag: "🇧🇷", name: "Brazil" },
  { code: "+1", country: "US", flag: "🇺🇸", name: "United States" },
  { code: "+52", country: "MX", flag: "🇲🇽", name: "Mexico" },
  { code: "+54", country: "AR", flag: "🇦🇷", name: "Argentina" },
  { code: "+56", country: "CL", flag: "🇨🇱", name: "Chile" },
  { code: "+57", country: "CO", flag: "🇨🇴", name: "Colombia" },
] as const;

type CountryCode = (typeof COUNTRY_CODES)[number];

function formatPhoneDisplay(num: string): string {
  const cleaned = num.replace(/\D/g, "");
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 7) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
}

function parseE164(value: string): { countryCode: string; localNumber: string } {
  if (!value) {
    return { countryCode: "+55", localNumber: "" };
  }

  const country = COUNTRY_CODES.find((c) => value.startsWith(c.code));
  if (country) {
    return {
      countryCode: country.code,
      localNumber: value.slice(country.code.length),
    };
  }

  return { countryCode: "+55", localNumber: value.replace(/^\+/, "") };
}

export function PhoneInput({ value, onChange, error, disabled, className }: PhoneInputProps) {
  const parsed = parseE164(value);
  const [countryCode, setCountryCode] = React.useState(parsed.countryCode);
  const [localNumber, setLocalNumber] = React.useState(parsed.localNumber);

  React.useEffect(() => {
    const newParsed = parseE164(value);
    setCountryCode(newParsed.countryCode);
    setLocalNumber(newParsed.localNumber);
  }, [value]);

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "");
    setLocalNumber(cleaned);
    onChange(`${countryCode}${cleaned}`);
  };

  const handleCountryChange = (country: CountryCode) => {
    setCountryCode(country.code);
    onChange(`${country.code}${localNumber}`);
  };

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) ?? COUNTRY_CODES[0];

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={disabled}
            render={
              <Button
                variant="outline"
                size="default"
                className="w-[100px] justify-between"
                data-testid="country-code-trigger"
              />
            }
          >
            <span className="flex items-center gap-1.5">
              <span>{selectedCountry?.flag}</span>
              <span>{countryCode}</span>
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[180px]">
            {COUNTRY_CODES.map((country) => (
              <DropdownMenuItem
                key={country.code}
                onSelect={() => handleCountryChange(country)}
                data-testid={`country-option-${country.country}`}
              >
                <span className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.code}</span>
                  <span className="text-muted-foreground">{country.name}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Input
          type="tel"
          value={formatPhoneDisplay(localNumber)}
          onChange={handleLocalChange}
          placeholder="11 99999-9999"
          className={cn("flex-1", error && "border-destructive")}
          disabled={disabled}
          maxLength={14}
          data-testid="phone-input"
          aria-invalid={!!error}
        />
      </div>

      {error && (
        <p className="text-xs text-destructive" data-testid="phone-error">
          {error}
        </p>
      )}
    </div>
  );
}

export { COUNTRY_CODES };
