import { useEffect, useState } from "react";
import {
  Alert,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { isPlatformAdmin } from "../../auth/access";
import { useAuth } from "../../auth/context/AuthContext";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { rolesApi, type RoleCatalogItem } from "../api/rolesApi";

export function RoleManagementPage() {
  const { session } = useAuth();
  const platformAdmin = isPlatformAdmin(session);
  const [items, setItems] = useState<RoleCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    rolesApi
      .list(platformAdmin ? "platform" : "company")
      .then((response) => {
        if (active) {
          setItems(response);
        }
      })
      .catch(() => {
        if (active) {
          setError("Role catalog data could not be loaded.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [platformAdmin]);

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow={
          platformAdmin ? "Platform Administration" : "Company Administration"
        }
        title="Role Catalog"
        description={
          platformAdmin
            ? "Review the governed access model available across the platform and see how widely each role is assigned."
            : "Review the tenant-safe role catalog available to your company and see current assignment coverage."
        }
      />

      {error ? <Alert severity="error">{error}</Alert> : null}

      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState
            title="No roles available"
            description="The role catalog is currently unavailable for this workspace."
          />
        ) : (
          <Paper sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Role</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Assigned Users</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.name} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography sx={{ fontWeight: 700 }}>
                          {item.displayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{item.scope}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="right">{item.userCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </PageCard>
    </Stack>
  );
}
