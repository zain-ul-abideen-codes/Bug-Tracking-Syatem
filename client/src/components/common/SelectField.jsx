import { FormControl, InputLabel, MenuItem, OutlinedInput, Select } from "@mui/material";

export default function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  error,
  multiple = false,
}) {
  return (
    <FormControl fullWidth size="small" error={Boolean(error)}>
      <InputLabel>{label}</InputLabel>
      <Select
        input={<OutlinedInput label={label} />}
        name={name}
        value={value}
        onChange={onChange}
        multiple={multiple}
      >
        {!multiple ? <MenuItem value="">Select an option</MenuItem> : null}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
