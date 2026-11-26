import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker&url";

/** Render file bytes as pixels; never navigate a frame to uploaded content. */
export function PdfDocumentPreview({ blob, onReady, onError }: {
  blob: Blob; onReady: () => void; onError: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const callbacks = useRef({ onReady, onError });
  callbacks.current = { onReady, onError };
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    let task: PDFDocumentLoadingTask | undefined;
    setPdf(null); setPage(1); setBusy(true); setFailed(false);
    void (async () => {
      const library = await import("pdfjs-dist/legacy/build/pdf.mjs");
      if (!active) return;
      library.GlobalWorkerOptions.workerSrc = workerUrl;
      const data = new Uint8Array(await blob.arrayBuffer());
      if (!active) return;
      task = library.getDocument({ data, enableXfa: false, useWasm: false,
        disableWorkerRendering: true, useSystemFonts: true });
      const document = await task.promise;
      if (active) setPdf(document);
    })().catch(() => { if (active) { setFailed(true); setBusy(false); callbacks.current.onError(); } });
    return () => { active = false; void task?.destroy().catch(() => {}); };
  }, [blob]);
  useEffect(() => {
    if (!pdf) return;
    let active = true;
    let rendering: RenderTask | undefined;
    setBusy(true);
    void (async () => {
      const source = await pdf.getPage(page);
      if (!active || !canvas.current) return;
      const viewport = source.getViewport({ scale: 1 });
      // Bound canvas allocation even for unusually large PDF page dimensions.
      const scale = Math.min(2, 1400 / Math.max(viewport.width, viewport.height));
      const scaled = source.getViewport({ scale });
      canvas.current.width = Math.ceil(scaled.width);
      canvas.current.height = Math.ceil(scaled.height);
      rendering = source.render({ canvas: canvas.current, viewport: scaled });
      await rendering.promise;
      if (active) { setBusy(false); callbacks.current.onReady(); }
    })().catch(() => { if (active) { setFailed(true); setBusy(false); callbacks.current.onError(); } });
    return () => { active = false; rendering?.cancel(); };
  }, [pdf, page]);
  return <Stack spacing={1}>
    {busy && <Typography role="status">Rendering document…</Typography>}
    {failed && <Alert severity="warning">The PDF couldn’t be rendered. Download it to review, or request a new copy.</Alert>}
    <Box sx={{ overflow: "auto", maxHeight: 600, backgroundColor: "#fff", display: failed ? "none" : "block" }}>
      <canvas ref={canvas} role="img" aria-label={`Uploaded document, page ${page}`} style={{ display: "block", width: "100%", height: "auto" }} />
    </Box>
    {pdf && pdf.numPages > 1 && <Stack direction="row" spacing={1} alignItems="center">
      <Button disabled={busy || page === 1} onClick={() => setPage(value => value - 1)}>Previous page</Button>
      <Typography aria-live="polite">Page {page} of {pdf.numPages}</Typography>
      <Button disabled={busy || page === pdf.numPages} onClick={() => setPage(value => value + 1)}>Next page</Button>
    </Stack>}
  </Stack>;
}
