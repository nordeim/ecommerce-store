"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

/**
 * TabsList — the reference app renders TWO variants of the pill style
 * (session-60, PDPTABS-STATES-1): the PDP variant —
 * `inline-flex h-9 items-center text-muted-foreground w-full justify-start
 * bg-secondary/50 rounded-xl p-1` (NO `overflow-x-auto` — measured live,
 * computed overflow-x: visible) — and the ACCOUNT variant, which appends
 * `overflow-x-auto` (the account-tabs consumer passes it via className;
 * the measured clone/reference account list is byte-identical that way).
 * The BASE here is the PDP variant (the minimal shadcn form).
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center text-muted-foreground bg-secondary/50 rounded-xl p-1 w-full justify-start",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

/**
 * TabsTrigger — the base carries the PDP variant (NO `gap-2`: the reference's
 * PDP triggers are text-only with no gap utility — computed gap normal; the
 * ACCOUNT variant appends `gap-2` via className, pairing with its lucide
 * icons — measured live, the account triggers' icon→text gap is 8px).
 *
 * THE CAPTURE-PHASE MOUSEDOWN GUARD (session-60, PDPTABS-STATES-1): Radix
 * >= 1.1 script-focuses the trigger in its mousedown handler
 * (`event.currentTarget.focus()` — added upstream for Safari's
 * no-focus-on-mousedown), and Chrome matches a script focus issued during
 * a mousedown dispatch against :focus-visible → the trigger's
 * `focus-visible:ring-2` utilities paint a 2px+4px ring around the CLICKED
 * trigger. The reference (older Radix) lets the BROWSER focus the trigger
 * natively — :focus-visible does NOT match, NO ring on click (the ring
 * still paints on the KEYBOARD path, both sites). Stopping the mousedown
 * at the CAPTURE phase keeps the native focus path (React's root-container
 * capture listener dispatches before the native descent; the bubble-phase
 * delegated handlers — Radix's script-focus mousedown included — never
 * run; the browser's default action still focuses the trigger; the
 * activation lands via Radix's onFocus auto-activation, at the same
 * mousedown instant as the reference). Ctrl/right-click mousedowns pass
 * through to Radix (its preventDefault branch). Validated by
 * scripts/pdptabs-experiment-r60.mjs (the DOM-mechanics experiment).
 */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow rounded-lg",
      className,
    )}
    onMouseDownCapture={(event) => {
      if (event.button === 0 && !event.ctrlKey && !event.defaultPrevented) {
        event.stopPropagation();
      }
    }}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-6",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
