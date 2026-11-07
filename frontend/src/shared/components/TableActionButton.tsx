import { IconButton, Tooltip, type IconButtonProps } from "@mui/material";
import type { PropsWithChildren } from "react";

interface TableActionButtonProps extends PropsWithChildren {
  title: string;
  buttonProps?: IconButtonProps;
  onClick: () => void;
}

export function TableActionButton({
  title,
  buttonProps,
  onClick,
  children,
}: TableActionButtonProps) {
  return (
    <Tooltip title={title}>
      <IconButton onClick={onClick} {...buttonProps} sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper", "&:hover": { borderColor: "primary.light", bgcolor: "rgba(49,91,125,.06)" }, ...buttonProps?.sx }}>
        {children}
      </IconButton>
    </Tooltip>
  );
}
