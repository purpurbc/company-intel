import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ui } from "@/src/lib/uiStyles";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? ui.buttonPrimary
      : variant === "secondary"
        ? ui.buttonSecondary
        : ui.buttonGhost;

  return (
    <button
      {...props}
      className={[ui.buttonBase, variantClass, className].join(" ")}
    >
      {children}
    </button>
  );
}