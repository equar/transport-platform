import { useEffect, useState } from 'react';
import { Alert, Button, Chip, Stack, Typography } from '@mui/material';
import { PageCard } from '../../../shared/components/PageCard';
import { driverPortalApi, type DriverPortalVehicleRecord } from '../api/driverPortalApi';
export function DriverVehiclesCard() {
  const [vehicles,setVehicles]=useState<DriverPortalVehicleRecord[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(false);const [version,setVersion]=useState(0);
  useEffect(()=>{let active=true;setLoading(true);setError(false);void driverPortalApi.getVehicles().then(data=>{if(active)setVehicles(data);}).catch(()=>{if(active)setError(true);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[version]);
  return <PageCard><Stack spacing={2}>
    <Typography variant="h5">My vehicles</Typography><Typography color="text.secondary">Vehicles you own or your transport provider has assigned to you. Trip assignments may vary.</Typography>
    {loading?<Typography color="text.secondary">Loading vehicles…</Typography>:error?<Alert severity="error" action={<Button onClick={()=>setVersion(value=>value+1)}>Retry</Button>}>Vehicles could not be loaded.</Alert>:!vehicles.length?<Typography color="text.secondary">No owned or assigned vehicles yet. Contact your transport provider to update your vehicle records.</Typography>:vehicles.map(vehicle=><Stack key={vehicle.id} spacing={1} sx={{border:1,borderColor:'divider',borderRadius:2,p:2}}>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap"><Typography fontWeight={600}>{vehicle.year} {vehicle.make} {vehicle.model}</Typography><Chip size="small" label={vehicle.ownedByCurrentDriver?'Owned by you':vehicle.ownershipType==='COMPANY_OWNED'?'Company owned':vehicle.ownershipType==='LEASED'?'Leased':'Driver owned'}/><Chip size="small" label={vehicle.status.replaceAll('_',' ')}/></Stack>
      <Typography color="text.secondary">{vehicle.plateNumber} · {vehicle.plateState} · {vehicle.vehicleCode}</Typography>
      <Typography color="text.secondary">{vehicle.capacity} seats · {vehicle.wheelchairCapacity??0} wheelchair spaces</Typography>
      <Typography variant="body2">{vehicle.assignedToCurrentDriver?'Currently assigned to you':'Owned by you; not currently assigned to you'}</Typography>
    </Stack>)}
  </Stack></PageCard>;
}
