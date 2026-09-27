"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function FotoComZoom({
  src,
  alt,
  fill = false,
  className,
  children,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label={`Ampliar foto: ${alt}`}
        className={cn(
          "cursor-zoom-in appearance-none border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          fill ? "absolute inset-0 h-full w-full" : "block w-full",
          className,
        )}
      >
        {children}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/80" />
        <Dialog.Popup
          aria-label={alt}
          className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none"
        >
          <Dialog.Close
            aria-label="Fechar"
            className="absolute -top-3 -right-3 flex size-8 items-center justify-center rounded-full bg-background text-foreground shadow-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X className="size-4" />
          </Dialog.Close>
          <img
            src={src}
            alt={alt}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
