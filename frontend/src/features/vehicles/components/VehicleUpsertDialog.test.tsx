import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { VehicleUpsertDialog } from './VehicleUpsertDialog';
vi.mock('./DriverPicker',()=>({DriverPicker:({label,value,onChange,error}:{label:string;value:number|null;onChange:(id:number|null)=>void;error?:string})=><label>{label}<input aria-label={label} value={value??''} onChange={event=>onChange(event.target.value?Number(event.target.value):null)}/>{error&&<span role="alert">{error}</span>}</label>}));
afterEach(cleanup);
function start() {
 const submit=vi.fn().mockResolvedValue(undefined);
 render(<VehicleUpsertDialog open vehicle={null} loading={false} onClose={()=>{}} onSubmit={submit}/>);
 for(const [label,value] of [['Make','Ford'],['Model','Transit'],['Plate Number','QA123'],['Plate State','MA']])fireEvent.change(screen.getByLabelText(new RegExp('^'+label)),{target:{value}});
 return submit;
}
function ownership(label:string) {fireEvent.mouseDown(screen.getByRole('combobox',{name:'Ownership Type'}));fireEvent.click(screen.getByRole('option',{name:label}));}
it('accepts a company vehicle without an owner',async()=>{
 const submit=start();fireEvent.click(screen.getByRole('button',{name:'Create Vehicle'}));
 await waitFor(()=>expect(submit).toHaveBeenCalledWith(expect.objectContaining({ownershipType:'COMPANY_OWNED',ownerDriverId:null})));
});
it('requires an owner for driver vehicles and preserves a different operating assignment',async()=>{
 const submit=start();ownership('DRIVER OWNED');fireEvent.click(screen.getByRole('button',{name:'Create Vehicle'}));
 expect(submit).not.toHaveBeenCalled();expect(screen.getByText('Select the driver who owns this vehicle.')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Owning driver'),{target:{value:'7'}});fireEvent.change(screen.getByLabelText('Assigned driver'),{target:{value:'8'}});
 fireEvent.click(screen.getByRole('button',{name:'Create Vehicle'}));
 await waitFor(()=>expect(submit).toHaveBeenCalledWith(expect.objectContaining({ownershipType:'DRIVER_OWNED',ownerDriverId:7,assignedDriverId:8})));
});
it('clears driver ownership when switching back to company ownership',async()=>{
 const submit=start();ownership('DRIVER OWNED');fireEvent.change(screen.getByLabelText('Owning driver'),{target:{value:'7'}});ownership('COMPANY OWNED');
 expect(screen.queryByLabelText('Owning driver')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Create Vehicle'}));
 await waitFor(()=>expect(submit).toHaveBeenCalledWith(expect.objectContaining({ownershipType:'COMPANY_OWNED',ownerDriverId:null})));
});
