"use client";

/* eslint-disable @next/next/no-img-element -- Uploaded proof URLs are dynamic and may use arbitrary storage hosts. */
import { useEffect, useState } from "react";
import { Download, FileText, Image as ImageIcon, ZoomIn } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function fileNameFromUrl(url: string) {
  try {
    return decodeURIComponent(new URL(url, "http://localhost").pathname.split("/").pop() || "payment-proof");
  } catch {
    return "payment-proof";
  }
}

export function RequestProofPreview({
  url,
  file,
  name,
  compact = false,
  title = "Payment proof",
}: {
  url?: string;
  file?: File;
  name?: string;
  compact?: boolean;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [localUrl, setLocalUrl] = useState<string>();
  const filename = file?.name ?? name ?? (url ? fileNameFromUrl(url) : "payment-proof");
  const sourceUrl = localUrl ?? url;
  const isPdf = file?.type === "application/pdf" || Boolean((file?.name ?? url ?? "").split(/[?#]/, 1)[0].toLowerCase().endsWith(".pdf"));

  useEffect(() => {
    setImageError(false);
    if (!file) {
      setLocalUrl(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setLocalUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, url]);

  async function downloadFile() {
    setIsDownloading(true);
    try {
      let blob: Blob;
      if (file) blob = file;
      else {
        if (!url) throw new Error("No file to download");
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Download failed (${response.status})`);
        blob = await response.blob();
      }
      const extension = blob.type.includes("pdf") ? ".pdf" : blob.type.includes("png") ? ".png" : blob.type.includes("webp") ? ".webp" : blob.type.includes("jpeg") ? ".jpg" : "";
      const downloadName = /\.[a-z0-9]{2,5}$/i.test(filename) ? filename : `${filename}${extension}`;
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = downloadName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      toast.error("Could not download this file. Check that the file URL allows downloads.");
    } finally {
      setIsDownloading(false);
    }
  }

  return <>
    <div className={compact ? "min-w-0" : "sm:col-span-2"}>
      {!compact && <p className="mb-1.5 text-xs text-muted-foreground">{title}</p>}
      <button type="button" onClick={() => setOpen(true)} aria-label={`Preview ${title.toLowerCase()}`} className={compact ? "group flex w-full items-center gap-2 overflow-hidden rounded-lg border border-border bg-background/80 p-1.5 text-left transition hover:border-primary/50 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" : "group block w-full overflow-hidden rounded-xl border border-border bg-muted/30 text-left transition hover:border-primary/50 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"}>
        {compact ? (
          <>
            <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-neutral-950">
              {isPdf ? <FileText className="absolute inset-0 m-auto size-5 text-primary" /> : imageError ? <ImageIcon className="absolute inset-0 m-auto size-5 text-white/60" /> : sourceUrl ? <img src={sourceUrl} alt={`${title} thumbnail`} loading="lazy" onError={() => setImageError(true)} className="absolute inset-0 size-full object-cover" /> : <ImageIcon className="absolute inset-0 m-auto size-5 text-white/60" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-foreground">{filename}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground"><ZoomIn className="size-3" />Click to preview</span>
            </span>
          </>
        ) : <>
        <div className="relative aspect-[16/7] min-h-32 max-h-48 w-full overflow-hidden bg-neutral-950">
          {isPdf ? <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 text-white"><FileText className="size-8 text-primary" /><span className="max-w-[80%] truncate text-xs">{filename}</span></div> : imageError ? <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 text-sm text-white/75"><ImageIcon className="size-7" />Preview unavailable</div> : sourceUrl ? <img src={sourceUrl} alt="Payment proof preview" loading="lazy" onError={() => setImageError(true)} className="absolute inset-0 size-full object-contain transition-transform duration-300 group-hover:scale-[1.02]" /> : <span className="flex h-full min-h-32 items-center justify-center text-sm text-white/75">Preparing preview…</span>}
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-lg bg-black/65 px-2.5 py-1.5 text-xs font-medium text-white opacity-90 backdrop-blur-sm"><ZoomIn className="size-3.5" />Preview</span>
        </div>
        <span className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground"><ImageIcon className="size-3.5 shrink-0 text-primary" /><span className="truncate">{filename}</span></span>
        </>}
      </button>
    </div>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[94vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-5xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription className="truncate">{filename}</DialogDescription></DialogHeader>
        <div className="relative min-h-[240px] overflow-hidden rounded-xl bg-neutral-950 sm:h-[min(68vh,720px)]">
          {isPdf ? sourceUrl && <iframe title="Payment proof PDF" src={sourceUrl} className="h-[68vh] min-h-[240px] w-full border-0" /> : imageError ? <div className="flex min-h-[240px] items-center justify-center text-sm text-white/75">Image preview unavailable</div> : sourceUrl && <img src={sourceUrl} alt="Payment proof" onError={() => setImageError(true)} className="absolute inset-0 size-full object-contain" />}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => void downloadFile()} disabled={isDownloading}><Download className="size-4" />{isDownloading ? "Preparing download…" : "Download"}</Button>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
