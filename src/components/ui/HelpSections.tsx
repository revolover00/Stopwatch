import type { HelpBlock } from '../../content/help';

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export function HelpSections({ blocks }: { readonly blocks: readonly HelpBlock[] }) {
  return (
    <div className="mt-14 grid gap-9">
      {blocks.map((block) => {
        const id = slugify(block.heading);
        return (
          <section key={block.heading} aria-labelledby={id}>
            <h2 id={id} className="text-title font-semibold tracking-tight text-ink">
              {block.heading}
            </h2>

            <div className="prose-copy mt-2.5 grid gap-3">
              {block.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}

              {block.bullets ? (
                <ul className="grid gap-2 pl-1">
                  {block.bullets.map((bullet) => (
                    <li key={bullet} className="relative pl-5">
                      <span
                        className="absolute left-0 top-2.5 size-1.5 rounded-full bg-accent"
                        aria-hidden="true"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
