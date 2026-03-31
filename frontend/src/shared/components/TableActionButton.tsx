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
      <IconButton onClick={onClick} {...buttonProps}>
        {children}
      </IconButton>
    </Tooltip>
  );
}
