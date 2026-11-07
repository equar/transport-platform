import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Dialog, Divider, InputAdornment, List, ListItemButton, ListItemIcon, ListItemText, TextField, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useNavigate } from 'react-router-dom';
import type { AppShellNavSection } from './appShellNavigation';
export function WorkspaceSearch({ sections }: { sections: AppShellNavSection[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const shortcut = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';
  const items = useMemo(() => [...new Map(sections.flatMap(section => section.items).map(item => [item.to, item])).values()], [sections]);
  const results = items.filter(item => (item.label + ' ' + item.description).toLowerCase().includes(query.trim().toLowerCase())).slice(0, 12);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(value => !value); } };
    window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey);
  }, []);
  function close() { setOpen(false); setQuery(''); }
  function go(path: string) { close(); navigate(path); }
  return <>
    <Button aria-label="Search workspace pages" onClick={() => setOpen(true)} color="inherit" startIcon={<SearchRoundedIcon sx={{ color: '#7b8999' }} />} sx={{ minWidth: { xs: 40, sm: 200 }, px: { xs: 1, sm: 1.5 }, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 }, ml: 0 }, justifyContent: 'flex-start', bgcolor: '#f5f7fa', border: '1px solid #e9edf2', color: '#8090a2', fontSize: '.75rem' }}><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Jump to a page</Box><Box component="kbd" sx={{ display: { xs: 'none', sm: 'block' }, ml: 'auto', px: .75, py: .1, fontSize: '.65rem', color: '#8793a1', border: '1px solid #dde3ea', borderRadius: .4 }}>{shortcut}</Box></Button>
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm" aria-label="Find a workspace page">
      <TextField autoFocus value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && results[0]) { event.preventDefault(); go(results[0].to); } }} placeholder="Search pages and tools…" inputProps={{ 'aria-label': 'Search pages and tools' }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }} sx={{ p: 2, '& fieldset': { border: 0 } }} />
      <Divider /><Typography variant="overline" color="text.secondary" sx={{ px: 3, pt: 2 }}>Your available pages</Typography>
      <List sx={{ px: 1.5, pb: 2, maxHeight: 420, overflow: 'auto' }}>{results.map(item => <ListItemButton key={item.to} onClick={() => go(item.to)} sx={{ borderRadius: 1, py: 1.25 }}><ListItemIcon sx={{ minWidth: 38, color: '#69809a' }}>{item.icon}</ListItemIcon><ListItemText primary={item.label} secondary={item.description} primaryTypographyProps={{ fontSize: '.85rem', fontWeight: 600 }} secondaryTypographyProps={{ fontSize: '.72rem' }}/><ArrowForwardRoundedIcon sx={{ fontSize: 16, color: '#a3afbb' }}/></ListItemButton>)}{!results.length && <Typography sx={{ px: 2, py: 4, color: 'text.secondary', fontSize: '.9rem' }}>No matching pages. Try a name such as “rides” or “billing”.</Typography>}</List>
    </Dialog>
  </>;
}
