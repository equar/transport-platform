import { useEffect, useState } from 'react';
import { Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { driversApi } from '../../drivers/api/driversApi';
export function DriverReference({ id }: { id?: number | null }) {
  const [name,setName]=useState<string|null>(null);
  useEffect(()=>{let active=true;setName(null);if(id)void driversApi.getById(id).then(driver=>{if(active)setName(`${driver.firstName} ${driver.lastName} · ${driver.driverCode}`);}).catch(()=>{});return()=>{active=false;};},[id]);
  if(!id)return <Typography component="span" color="text.secondary">Not assigned</Typography>;
  return <Link component={RouterLink} to={`/company/drivers/${id}`}>{name||`Driver #${id}`}</Link>;
}
