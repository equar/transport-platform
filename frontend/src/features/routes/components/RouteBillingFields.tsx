import { Alert, Autocomplete, MenuItem, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { billingApi, billToTypeOptions, type LookupOption } from "../../billing/api/billingApi";
import { getApiErrorMessage } from "../../../shared/api/client";
import type { RoutePayload } from "../api/routesApi";

export function RouteBillingFields({ value, onChange }: {
  value: RoutePayload;
  onChange: (value: RoutePayload) => void;
}) {
  const [options, setOptions] = useState<LookupOption[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const price = value.billingTripType === "ROUND_TRIP" ? value.roundTripPrice : value.price;
  const priced = price != null;
  useEffect(() => {
    let active = true;
    setOptions([]);
    if (!priced || !value.billToType) return;
    const timer = setTimeout(() => {
      setLoading(true); setError(null);
      billingApi.searchBillToOptions(value.billToType!, search)
        .then(items => { if (active) setOptions(items); })
        .catch(reason => { if (active) setError(getApiErrorMessage(reason, "Billing accounts couldn’t be loaded. Try searching again.")); })
        .finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [priced, value.billToType, search]);
  const selected = value.billToId == null ? null : options.find(option => option.id === value.billToId)
    ?? { id: value.billToId, label: `Selected account #${value.billToId}`, secondaryLabel: "" };
  return <Stack spacing={2}>
    <TextField select label="Billing journey" value={value.billingTripType ?? "ONE_WAY"}
      onChange={event => onChange({ ...value, billingTripType: event.target.value as "ONE_WAY" | "ROUND_TRIP" })}>
      <MenuItem value="ONE_WAY">One way</MenuItem><MenuItem value="ROUND_TRIP">Round trip</MenuItem>
    </TextField>
    {([['price', 'One-way price (USD)'], ['roundTripPrice', 'Round-trip price (USD)']] as const).map(([field, label]) =>
      <TextField key={field} label={label} type="number" value={value[field] ?? ""}
        onChange={event => onChange({ ...value, [field]: event.target.value === "" ? null : Number(event.target.value) })}
        inputProps={{ min: 0, max: 9999999999.99, step: 0.01 }} helperText="Optional total for the entire route." />)}
    <Alert severity="info">{priced
      ? "Completing this route creates one draft invoice for the selected journey price. The tenant admin reviews and issues it."
      : "No price for this journey. The tenant admin creates the invoice manually."}</Alert>
    {priced && <>
      <TextField select required label="Billing account type" value={value.billToType ?? ""}
        onChange={event => { setSearch(""); onChange({ ...value, billToType: event.target.value as RoutePayload['billToType'], billToId: null }); }}>
        {billToTypeOptions.map(type => <MenuItem key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</MenuItem>)}
      </TextField>
      <Autocomplete options={selected && !options.some(option => option.id === selected.id) ? [selected, ...options] : options} value={selected} loading={loading} disabled={!value.billToType}
        getOptionLabel={option => option.label} isOptionEqualToValue={(a, b) => a.id === b.id}
        onInputChange={(_, text, reason) => { if (reason === 'input' || reason === 'clear') setSearch(text); }}
        onChange={(_, option) => onChange({ ...value, billToId: option?.id ?? null })}
        renderInput={params => <TextField {...params} required label="Billing account" error={!!error} helperText={error ?? "Search and select who pays for the entire route."} />} />
    </>}
  </Stack>;
}
