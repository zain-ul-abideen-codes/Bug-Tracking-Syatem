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
    <label className="field">
      <span>{label}</span>
      <select
        className={error ? "field-input field-input-error" : "field-input"}
        name={name}
        value={value}
        onChange={onChange}
        multiple={multiple}
      >
        {!multiple ? <option value="">Select an option</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}
