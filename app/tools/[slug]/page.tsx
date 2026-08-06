import type { Metadata } from "next";
import Link from "next/link";
import { ToolWorkspace } from "@/components/tf/ToolWorkspace";
import { TOOLS, getTool } from "@/lib/tools";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) {
    return { title: "Tool not found" };
  }
  return {
    title: tool.name,
    description: `${tool.desc} · ${tool.cat} tool in ToolFerry. ${tool.deps ? `Uses ${tool.deps}.` : ""}`.trim(),
    openGraph: {
      title: `${tool.name} — ToolFerry`,
      description: tool.desc,
    },
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool) {
    return (
      <main className="animate-tf-fade mx-auto max-w-[640px] px-5 py-20 text-center md:px-7">
        <div className="font-display text-[48px] font-extrabold tracking-tight">
          404
        </div>
        <p className="mt-3 text-[15px] text-[var(--ink2)]">
          No tool at{" "}
          <span className="font-mono text-[13px]">/tools/{slug}</span>. Search
          the catalogue instead.
        </p>
        <Link
          href={`/tools?focus=1`}
          className="mt-6 inline-flex h-10 items-center rounded-full border border-[var(--line2)] px-4 text-[13.5px] text-[var(--ink2)]"
        >
          Search tools
        </Link>
      </main>
    );
  }

  return <ToolWorkspace tool={tool} />;
}
