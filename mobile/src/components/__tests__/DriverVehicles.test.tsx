import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { DriverVehicles } from '../DriverVehicles';
jest.mock('@expo/vector-icons',()=>({MaterialCommunityIcons:'Icon'}));
jest.mock('@api/driverPortalApi',()=>({driverPortalApi:{getVehicles:jest.fn()}}));
let mockRows:unknown[]=[];
jest.mock('@tanstack/react-query',()=>({useQuery:()=>({data:mockRows,isLoading:false,isError:false,isRefetching:false,refetch:jest.fn()})}));
it('shows owned and company-assigned vehicles without conflating ownership and assignment',()=>{
 mockRows=[{id:1,vehicleCode:'OWN-1',ownershipType:'DRIVER_OWNED',ownedByCurrentDriver:true,assignedToCurrentDriver:false,year:2024,make:'Ford',model:'Transit',plateNumber:'OWN1',plateState:'MA',capacity:6,wheelchairCapacity:0,status:'ACTIVE'},
 {id:2,vehicleCode:'CO-2',ownershipType:'COMPANY_OWNED',ownedByCurrentDriver:false,assignedToCurrentDriver:true,year:2023,make:'Toyota',model:'Sienna',plateNumber:'CO2',plateState:'MA',capacity:6,wheelchairCapacity:0,status:'ACTIVE'}];
 render(<DriverVehicles/>);
 expect(screen.getByText('Owned by you')).toBeTruthy();expect(screen.getByText('Company owned')).toBeTruthy();
 expect(screen.getByText('Owned by you; not currently assigned to you')).toBeTruthy();expect(screen.getByText('Currently assigned to you')).toBeTruthy();
});
it('shows a useful empty state instead of fabricated vehicle details',()=>{mockRows=[];render(<DriverVehicles/>);expect(screen.getByText('No vehicles linked yet')).toBeTruthy();expect(screen.queryByText('Ready')).toBeNull();});
