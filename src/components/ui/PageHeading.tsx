import type { ReactNode } from 'react';

interface PageHeadingProps {
  readonly title: string;
  readonly lead: string;
  readonly aside?: ReactNode;
}

export function PageHeading({ title, lead, aside }: PageHeadingProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[2.125rem]">
          {title}
        </h1>
        <p className="mt-2 max-w-prose text-body leading-relaxed text-muted">{lead}</p>
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}
