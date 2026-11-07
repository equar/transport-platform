import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import { useUrlFilters } from './useUrlFilters';
afterEach(cleanup);
function List() {
  const [filters,setFilters]=useUrlFilters({keyword:'',page:0});const navigate=useNavigate();
  return <><div>{filters.keyword}:{filters.page}</div><button onClick={()=>setFilters({keyword:'school',page:3})}>Filter</button><button onClick={()=>navigate('/detail')}>Detail</button></>;
}
function Detail() {const navigate=useNavigate();return <button onClick={()=>navigate(-1)}>Back</button>;}
it('restores the filter and page when returning from a detail page',async()=>{
  render(<MemoryRouter initialEntries={['/list']}><Routes><Route path="/list" element={<List />} /><Route path="/detail" element={<Detail />} /></Routes></MemoryRouter>);
  fireEvent.click(screen.getByText('Filter'));await screen.findByText('school:3');
  fireEvent.click(screen.getByText('Detail'));fireEvent.click(screen.getByText('Back'));
  await screen.findByText('school:3');expect(screen.queryByText(':0')).toBeNull();
});
