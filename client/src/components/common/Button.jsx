import MuiButton from "@mui/material/Button";

const variantMap = {
  primary: { variant: "contained", color: "primary" },
  secondary: { variant: "contained", color: "secondary" },
  ghost: { variant: "outlined", color: "inherit" },
  danger: { variant: "contained", color: "error" },
};

export default function Button({ children, type = "button", variant = "primary", onClick, disabled = false }) {
  const config = variantMap[variant] || variantMap.primary;

  return (
    <MuiButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      {...config}
    >
      {children}
    </MuiButton>
  );
}
