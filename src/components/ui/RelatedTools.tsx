import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '../icons';

export interface ToolLink {
  readonly to: string;
  readonly title: string;
  readonly description: string;
}

export function RelatedTools({
  heading,
  tools,
  className,
}: {
  readonly heading: string;
  readonly tools: readonly ToolLink[];
  readonly className?: string;
}) {
  return (
    <section aria-labelledby="related-heading" className={className ?? 'mt-14'}>
      <h2 id="related-heading" className="text-title font-semibold tracking-tight text-ink">
        {heading}
      </h2>
      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {tools.map((tool) => (
          <li key={tool.to}>
            <Link
              to={tool.to}
              className="group flex items-start justify-between gap-3 rounded-xl border border-line bg-panel/60 px-4 py-3.5 transition-colors hover:border-ink/25 hover:bg-panel"
            >
              <span>
                <span className="block text-small font-semibold text-ink">{tool.title}</span>
                <span className="mt-0.5 block text-caption text-muted">{tool.description}</span>
              </span>
              <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
