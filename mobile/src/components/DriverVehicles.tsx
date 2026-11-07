import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { driverPortalApi } from '@api/driverPortalApi';
import { AppBadge, AppButton, AppCard } from './ui';
import { EmptyState } from './EmptyState';
import { SectionHeader } from './SectionHeader';
import { Colors, Spacing, Typography } from '@theme/tokens';
import { formatDate } from '@utils/formatDate';
export function DriverVehicles() {
  const query=useQuery({queryKey:['driver-vehicles'],queryFn:driverPortalApi.getVehicles});
  return <View style={styles.section}>
    <SectionHeader title="My vehicles" subtitle="Vehicles you own or your provider has assigned to you." />
    {query.isLoading?<AppCard><Text style={styles.body}>Loading vehicles…</Text></AppCard>:query.isError?<AppCard><Text style={styles.body}>Vehicles couldn’t be loaded.</Text><AppButton label="Retry vehicles" variant="outlined" onPress={()=>void query.refetch()}/></AppCard>:!query.data?.length?<AppCard><EmptyState title="No vehicles linked yet" description="Contact your transport provider to register your vehicle or update an assignment." /></AppCard>:query.data.map(vehicle=><AppCard key={vehicle.id} style={styles.card}>
      <View style={styles.row}><AppBadge status={vehicle.ownershipType} label={vehicle.ownedByCurrentDriver?'Owned by you':vehicle.ownershipType==='COMPANY_OWNED'?'Company owned':vehicle.ownershipType==='LEASED'?'Leased':'Driver owned'} /><AppBadge status={vehicle.status}/></View>
      <Text style={styles.title}>{vehicle.year} {vehicle.make} {vehicle.model}</Text>
      <Text style={styles.body}>{vehicle.plateNumber} · {vehicle.plateState}</Text><Text style={styles.caption}>{vehicle.vehicleCode}</Text>
      <Text style={styles.body}>{vehicle.capacity} seats · {vehicle.wheelchairCapacity??0} wheelchair spaces</Text>
      <Text style={styles.caption}>{vehicle.assignedToCurrentDriver?'Currently assigned to you':'Owned by you; not currently assigned to you'}</Text>
      <Text style={styles.caption}>Insurance expires: {vehicle.insuranceExpiryDate?formatDate(vehicle.insuranceExpiryDate):'Not provided'}</Text>
      <Text style={styles.caption}>Registration expires: {vehicle.registrationExpiryDate?formatDate(vehicle.registrationExpiryDate):'Not provided'}</Text>
      <Text style={styles.caption}>Inspection expires: {vehicle.inspectionExpiryDate?formatDate(vehicle.inspectionExpiryDate):'Not provided'}</Text>
    </AppCard>)}
    {!!query.data?.length&&<AppButton label="Refresh vehicles" variant="outlined" loading={query.isRefetching} onPress={()=>void query.refetch()}/>}
  </View>;
}
const styles=StyleSheet.create({section:{gap:Spacing.lg},card:{gap:Spacing.md},row:{flexDirection:'row',flexWrap:'wrap',gap:Spacing.sm},title:{fontFamily:Typography.fontHeading,fontSize:Typography.sizeXl,color:Colors.textPrimary},body:{fontFamily:Typography.fontBody,fontSize:Typography.sizeMd,color:Colors.textPrimary,lineHeight:23},caption:{fontFamily:Typography.fontBody,fontSize:Typography.sizeSm,color:Colors.textSecondary,lineHeight:21}});
