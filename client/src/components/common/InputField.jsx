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
    <label className="field">
      <span>{label}</span>
      <input
        className={error ? "field-input field-input-error" : "field-input"}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}
