type ClassValue = string | false | null | undefined;

/** Tiny class-name joiner — keeps conditional Tailwind lists readable. */
export const cx = (...values: ClassValue[]): string => values.filter(Boolean).join(' ');
