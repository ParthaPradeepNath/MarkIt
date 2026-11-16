import { createContext, useCallback, useContext, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ConfirmContext = createContext(() => Promise.resolve(true));

export function ConfirmProvider({ children }) {
  const [pending, setPending] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setPending({
        resolve,
        title: typeof options === "string" ? options : options?.title,
        description: typeof options === "object" ? options?.description : undefined,
        confirmLabel: typeof options === "object" ? options?.confirmLabel : undefined,
        cancelLabel: typeof options === "object" ? options?.cancelLabel : undefined,
        tone: typeof options === "object" ? options?.tone : "danger",
      });
    });
  }, []);

  const settle = (result) => {
    pending?.resolve(result);
    setPending(null);
  };

  const tone = pending?.tone || "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={!!pending} onOpenChange={(open) => !open && settle(false)}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <div className="flex gap-3.5">
            <div
              className={
                tone === "danger"
                  ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/15 ring-inset"
                  : "flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15 ring-inset"
              }
            >
              <AlertTriangle className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <DialogHeader>
              <DialogTitle>{pending?.title || "Are you sure?"}</DialogTitle>
              {pending?.description && (
                <DialogDescription>{pending.description}</DialogDescription>
              )}
            </DialogHeader>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => settle(false)}>
              {pending?.cancelLabel || "Cancel"}
            </Button>
            <Button
              variant={tone === "danger" ? "destructive" : "default"}
              onClick={() => settle(true)}
              autoFocus
            >
              {pending?.confirmLabel || "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
