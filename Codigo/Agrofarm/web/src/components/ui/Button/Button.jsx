import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../../lib/utils.js";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center rounded-lg px-6 text-sm font-bold transition-[filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[#1A3E3E] text-white shadow-sm hover:brightness-[0.92] focus-visible:ring-[#1A3E3E]/40",
        primaryBrand: "bg-[#2D5A43] text-white shadow-sm hover:brightness-[0.92] focus-visible:ring-[#2D5A43]/40",
        danger: "bg-[#D32F2F] text-white shadow-sm hover:brightness-[0.92] focus-visible:ring-[#D32F2F]/40",
        outline: "border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:ring-gray-300",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export default function Button({
  type = "button",
  variant = "primary",
  className,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  return <Comp type={type} className={cn(buttonVariants({ variant }), className)} {...props} />;
}
