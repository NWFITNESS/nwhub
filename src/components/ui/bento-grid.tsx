import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const BentoGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("grid w-full auto-rows-[20rem] grid-cols-3 gap-4", className)}>
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
}: {
  name: string;
  className: string;
  background: ReactNode;
  Icon: React.ElementType;
  description: string;
  href: string;
  cta: string;
}) => (
  <a
    href={href}
    key={name}
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl no-underline",
      "bg-[#161616] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
      "transform-gpu transition-all duration-300 hover:border-white/[0.16] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_32px_rgba(150,119,5,0.08)]",
      className,
    )}
  >
    {/* Background layer */}
    <div className="absolute inset-0 pointer-events-none">{background}</div>

    {/* Content */}
    <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1.5 p-8 transition-all duration-300 group-hover:-translate-y-8">
      <Icon
        size={28}
        className="origin-left transform-gpu text-white/25 transition-all duration-300 ease-in-out group-hover:scale-90 group-hover:text-[#c9a70a]"
      />
      <h3 className="mt-2 text-base font-semibold text-white/80 group-hover:text-white transition-colors duration-300">
        {name}
      </h3>
      <p className="text-sm text-white/35 leading-relaxed">{description}</p>
    </div>

    {/* CTA row — slides up on hover */}
    <div className="pointer-events-none z-10 absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-6 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
      <span className="flex items-center gap-1.5 text-sm font-medium text-[#c9a70a]">
        {cta}
        <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </div>

    {/* Hover overlay */}
    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-white/[0.02]" />
  </a>
);

export { BentoCard, BentoGrid };
