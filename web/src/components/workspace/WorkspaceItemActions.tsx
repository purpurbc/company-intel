"use client";

import { Button, type ButtonVariant } from "@/src/components/ui/Button";
import { DropdownMenu } from "@/src/components/ui/DropdownMenu";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";

export type WorkspaceItemAction = {
  key: string;
  label: string;
  menuLabel?: string;
  onSelect: () => void | Promise<void>;
  iconSrc?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  busy?: boolean;
  buttonText?: string;
  separatorBefore?: boolean;
};

type WorkspaceItemActionsProps = {
  menuLabel: string;
  actions: WorkspaceItemAction[];
};

/**
 * Actions with buttonText remain directly available. Secondary actions stay
 * in one consistent overflow menu at every breakpoint.
 */
export function WorkspaceItemActions({
  menuLabel,
  actions,
}: WorkspaceItemActionsProps) {
  const primaryActions = actions.filter((action) => action.buttonText);
  const menuActions = actions.filter((action) => !action.buttonText);

  return (
    <div className="flex shrink-0 items-center gap-2">
      {primaryActions.map((action) => (
        <Button
          key={action.key}
          type="button"
          onClick={() => void action.onSelect()}
          disabled={action.disabled}
          variant={action.variant ?? "secondary"}
          size="icon"
          className="w-auto px-2 text-xs"
          aria-label={action.label}
          aria-busy={action.busy}
          title={action.label}
        >
          {action.iconSrc ? (
            <MaskedIcon
              src={action.iconSrc}
              className={[
                "h-4 w-4",
                action.busy ? "animate-spin" : "",
              ].join(" ")}
            />
          ) : null}
          {action.buttonText}
        </Button>
      ))}

      {menuActions.length > 0 ? (
        <DropdownMenu
          className="shrink-0"
          label={menuLabel}
          icon={
            <MaskedIcon
              src="/icons/utility/dots-vertical.svg"
              className="h-4 w-4"
            />
          }
          triggerVariant="ghost"
          triggerClassName="h-7 min-w-7 px-1.5"
          items={menuActions.map((action) => ({
            key: action.key,
            label: action.menuLabel ?? action.label,
            disabled: action.disabled,
            separatorBefore: action.separatorBefore,
            onSelect: action.onSelect,
            icon: action.iconSrc ? (
              <MaskedIcon
                src={action.iconSrc}
                className={[
                  "h-4 w-4",
                  action.busy ? "animate-spin" : "",
                ].join(" ")}
              />
            ) : undefined,
          }))}
        />
      ) : null}
    </div>
  );
}
