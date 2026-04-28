import TextField from "@mui/material/TextField";

export default function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
}) {
  return (
    <TextField
      fullWidth
      size="small"
      label={label}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      error={Boolean(error)}
      helperText={error || " "}
    />
  );
}
