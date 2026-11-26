import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { PdfDocumentPreview } from './PdfDocumentPreview';

/** Keep authenticated document bytes inside the app; blob PDF navigation may be blocked by CSP. */
export function DocumentFullView({ open, blob, imageUrl, fileName, onClose, onReady, onError }: {
  open: boolean; blob: Blob | null; imageUrl: string | null; fileName: string;
  onClose: () => void; onReady: () => void; onError: () => void;
}) {
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
    <DialogTitle>{fileName}</DialogTitle>
    <DialogContent>
      {imageUrl ? <Box component="img" src={imageUrl} alt="Full uploaded document"
        onLoad={onReady} onError={onError}
        sx={{ display: 'block', width: '100%', maxHeight: '78vh', objectFit: 'contain' }} />
        : blob && <PdfDocumentPreview blob={blob} onReady={onReady} onError={onError} />}
    </DialogContent>
    <DialogActions><Button onClick={onClose}>Close document</Button></DialogActions>
  </Dialog>;
}
