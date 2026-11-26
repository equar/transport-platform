import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PdfDocumentPreview } from './PdfDocumentPreview';
const mocks = vi.hoisted(() => ({ getDocument: vi.fn(), getPage: vi.fn(), render: vi.fn(), destroy: vi.fn(), cancel: vi.fn() }));
vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({ GlobalWorkerOptions: {}, getDocument: mocks.getDocument }));
vi.mock('pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker&url', () => ({ default: '/assets/pdf-worker.js' }));
beforeEach(() => {
  mocks.destroy.mockResolvedValue(undefined);
  mocks.render.mockReturnValue({ promise: Promise.resolve(), cancel: mocks.cancel });
  mocks.getPage.mockResolvedValue({ getViewport: ({ scale }: { scale: number }) => ({ width: 612 * scale, height: 792 * scale }), render: mocks.render });
  mocks.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 2, getPage: mocks.getPage }), destroy: mocks.destroy });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function blob() { return { arrayBuffer: async () => new Uint8Array([37, 80, 68, 70]).buffer } as Blob; }
it('renders bytes into a bounded canvas, navigates pages and destroys the PDF on close', async () => {
  const ready = vi.fn();
  const view = render(<PdfDocumentPreview blob={blob()} onReady={ready} onError={vi.fn()} />);
  await waitFor(() => expect(ready).toHaveBeenCalledTimes(1));
  expect(screen.getByRole('img', { name: 'Uploaded document, page 1' })).toBeTruthy();
  const canvas = screen.getByRole('img') as HTMLCanvasElement;
  expect(canvas.width).toBeLessThanOrEqual(1400);
  expect(canvas.height).toBeLessThanOrEqual(1400);
  expect(mocks.getDocument).toHaveBeenCalledWith(expect.objectContaining({ data: expect.any(Uint8Array), enableXfa: false, useWasm: false }));
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  await waitFor(() => expect(mocks.getPage).toHaveBeenCalledWith(2));
  expect(screen.getByText('Page 2 of 2')).toBeTruthy();
  view.unmount();
  expect(mocks.destroy).toHaveBeenCalledTimes(1);
});
it('reports malformed or unreadable PDFs without accepting review', async () => {
  mocks.getDocument.mockReturnValue({ promise: Promise.reject(new Error('Invalid PDF')), destroy: mocks.destroy });
  const error = vi.fn(); const ready = vi.fn();
  render(<PdfDocumentPreview blob={blob()} onReady={ready} onError={error} />);
  await screen.findByText(/PDF couldn’t be rendered/);
  expect(error).toHaveBeenCalledTimes(1);
  expect(ready).not.toHaveBeenCalled();
});
