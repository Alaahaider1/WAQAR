import { cn } from "@/lib/utils/cn";

type SectionLabelProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <p
      className={cn(
        "font-mono text-[10px] font-medium tracking-[0.25em] uppercase text-stone mb-4",
        className
      )}
    >
      {children}
    </p>
  );
}
