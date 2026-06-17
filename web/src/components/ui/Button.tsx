import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  ui,
  uiHeight,
  uiRadius,
  uiTextSize,
  uiWidth,
  type UiHeight,
  type UiRadius,
  type UiTextSize,
  type UiWidth,
} from "@/src/lib/uiStyles";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "dark"
  | "light"
  | "delete"
  | "accept"
  | "toggle"
  | "ghost";
export type ButtonSize = "md" | "sm" | "xs" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  width?: UiWidth;
  height?: UiHeight;
  radius?: UiRadius;
  textSize?: UiTextSize;
  children: ReactNode;
};

function buttonVariantClass(variant: ButtonVariant) {
  if (variant === "primary") return ui.buttonPrimary;
  if (variant === "secondary") return ui.buttonSecondary;
  if (variant === "accent") return ui.buttonAccent;
  if (variant === "dark") return ui.buttonDark;
  if (variant === "light") return ui.buttonLight;
  if (variant === "delete") return ui.buttonDelete;
  if (variant === "accept") return ui.buttonAccept;
  if (variant === "toggle") return ui.buttonToggle;
  return ui.buttonGhost;
}

export function buttonClassName({
  variant = "primary",
  size = "md",
  width,
  height,
  radius = "md",
  textSize,
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  width?: UiWidth;
  height?: UiHeight;
  radius?: UiRadius;
  textSize?: UiTextSize;
  className?: string;
}) {
  const sizeClass =
    size === "icon"
      ? "h-9 min-w-9 px-2 text-sm"
      : size === "xs"
        ? "px-2.5 py-1.5 text-xs"
      : size === "sm"
        ? "px-3 py-2 text-xs"
        : "px-4 py-2.5 text-sm";

  return [
    ui.buttonBase,
    uiRadius[radius],
    buttonVariantClass(variant),
    sizeClass,
    textSize ? uiTextSize[textSize] : "",
    width ? uiWidth[width] : "",
    height ? uiHeight[height] : "",
    className,
  ].join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  width,
  height,
  radius,
  textSize,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={buttonClassName({
        variant,
        size,
        width,
        height,
        radius,
        textSize,
        className,
      })}
    >
      {children}
    </button>
  );
}

type ActionControlProps = {
  label: string;
  icon?: ReactNode;
  children?: ReactNode;
  href?: string;
  disabled?: boolean;
  pressed?: boolean;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  width?: UiWidth;
  height?: UiHeight;
  radius?: UiRadius;
  textSize?: UiTextSize;
  className?: string;
};

export function ActionControl({
  label,
  icon,
  children,
  href,
  disabled = false,
  pressed,
  onClick,
  variant = "secondary",
  size = "icon",
  width,
  height,
  radius,
  textSize,
  className = "",
}: ActionControlProps) {
  const content = (
    <>
      {icon}
      {children ? <span>{children}</span> : null}
    </>
  );
  const controlClass = buttonClassName({
    variant,
    size,
    width,
    height,
    radius,
    textSize,
    className,
  });

  if (href && !disabled) {
    return (
      <Link href={href} aria-label={label} title={label} className={controlClass}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={controlClass}
    >
      {content}
    </button>
  );
}
