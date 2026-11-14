import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { driversApi, type DriverRecord } from '../../drivers/api/driversApi';
import { getApiErrorMessage } from "../../../shared/api/client";
export function DriverPicker({ label, value, onChange, required = false, error, helperText, disabled = false }: { label: string; value?: number | null; onChange: (id: number | null) => void; required?: boolean; error?: string; helperText?: string; disabled?: boolean }) {
  const [keyword,setKeyword]=useState('');const [options,setOptions]=useState<DriverRecord[]>([]);
  const [selected,setSelected]=useState<DriverRecord|null>(null);const [pending,setPending]=useState(false);const [loadError,setLoadError]=useState('');
  useEffect(()=>{let active=true;setSelected(null);if(value) void driversApi.getById(value).then(driver=>{if(active)setSelected(driver);}).catch((_caughtError)=>{if(active)setLoadError(getApiErrorMessage(_caughtError, 'The selected driver is unavailable. Choose a driver from this workspace.'));});return()=>{active=false;};},[value]);
  useEffect(()=>{let active=true;const timer=setTimeout(()=>{setPending(true);setLoadError('');void driversApi.search({keyword,status:'',driverType:'',page:0,size:20,sortBy:'lastName',sortDirection:'ASC'}).then(page=>{if(active)setOptions(page.items);}).catch((_caughtError)=>{if(active)setLoadError(getApiErrorMessage(_caughtError, 'Could not load drivers. Type a name to retry.'));}).finally(()=>{if(active)setPending(false);});},250);return()=>{active=false;clearTimeout(timer);};},[keyword]);
  const choices=selected&&!options.some(driver=>driver.id===selected.id)?[selected,...options]:options;
  return <Autocomplete fullWidth disabled={disabled} options={choices} value={choices.find(driver=>driver.id===value)??selected} loading={pending}
    isOptionEqualToValue={(a,b)=>a.id===b.id} filterOptions={items=>items}
    getOptionLabel={driver=>`${driver.firstName} ${driver.lastName} · ${driver.driverCode}`}
    onInputChange={(_,text,reason)=>{if(reason==='input'||reason==='clear')setKeyword(text);}}
    onChange={(_,driver)=>{setSelected(driver);onChange(driver?.id??null);}}
    noOptionsText={loadError||'No drivers found in this workspace'}
    renderInput={params=><TextField {...params} label={label} required={required} error={!!error||!!loadError} helperText={error||loadError||helperText}
      slotProps={{input:{...params.InputProps,endAdornment:<>{pending&&<CircularProgress size={18}/ >}{params.InputProps.endAdornment}</>}}} />}
  />;
}
