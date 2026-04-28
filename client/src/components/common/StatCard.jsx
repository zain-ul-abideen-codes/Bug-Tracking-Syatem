import { Card, CardContent, Stack, Typography } from "@mui/material";

const toneStyles = {
  default: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,250,252,0.92))",
  },
  accent: {
    background: "linear-gradient(180deg, rgba(31,111,120,0.14), rgba(255,255,255,0.95))",
  },
  warning: {
    background: "linear-gradient(180deg, rgba(217,119,6,0.16), rgba(255,255,255,0.95))",
  },
  success: {
    background: "linear-gradient(180deg, rgba(47,133,90,0.16), rgba(255,255,255,0.95))",
  },
  danger: {
    background: "linear-gradient(180deg, rgba(194,65,12,0.16), rgba(255,255,255,0.95))",
  },
  teal: {
    background: "linear-gradient(180deg, rgba(14,116,144,0.16), rgba(255,255,255,0.95))",
  },
};

export default function StatCard({ label, value, tone = "default", helper }) {
  return (
    <Card sx={toneStyles[tone] || toneStyles.default}>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h4">{value}</Typography>
          {helper ? (
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
