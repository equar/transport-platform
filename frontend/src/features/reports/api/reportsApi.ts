import { apiClient, unwrapResponse } from "../../../shared/api/client";
import type {
  BillToType,
  PaymentMethod,
  PaymentStatus,
} from "../../billing/api/billingApi";
import type {
  ComplianceEntityType,
  ComplianceIssueSeverity,
  ComplianceIssueStatus,
  ComplianceIssueType,
} from "../../compliance/api/complianceApi";
import type { DriverStatus, DriverType } from "../../drivers/api/driversApi";
import type {
  IncidentSeverity,
  IncidentStatus as IncidentWorkflowStatus,
  IncidentType,
} from "../../incidents/api/incidentsApi";
import type { RouteStatus } from "../../routes/api/routesApi";
import type { RideStatus, RideTripType, ServiceType } from "../../rides/api/ridesApi";
import type { RiderStatus, RiderType } from "../../riders/api/ridersApi";
import type {
  VehicleOwnershipType,
  VehicleStatus,
} from "../../vehicles/api/vehiclesApi";

export const reportTypeOptions = [
  "DRIVER",
  "VEHICLE",
  "RIDER",
  "RIDE",
  "ROUTE",
  "INVOICE",
  "PAYMENT",
  "COMPLIANCE",
  "INCIDENT",
] as const;

export const invoiceStatusOptions = [
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "VOID",
] as const;

export type ReportType = (typeof reportTypeOptions)[number];
export type InvoiceStatus = (typeof invoiceStatusOptions)[number];

export interface ReportDefinitionRecord {
  reportType: ReportType;
  title: string;
  description: string;
  supportedFilters: string[];
  exportFormats: string[];
}

export interface ReportMetricRecord {
  key: string;
  label: string;
  value: string | number;
}

export interface CompanyReportResponse<T> {
  reportType: ReportType;
  title: string;
  generatedAt: string;
  exportFormats: string[];
  summary: ReportMetricRecord[];
  rowCount: number;
  rows: T[];
}

export interface DriverReportRowRecord {
  id: number;
  driverCode: string;
  driverName: string;
  status: DriverStatus;
  driverType: DriverType;
  phone: string | null;
  email: string | null;
  licenseExpiryDate: string | null;
  trainingStatus: string | null;
  createdAt: string;
}

export interface VehicleReportRowRecord {
  id: number;
  vehicleCode: string;
  vehicleName: string;
  status: VehicleStatus;
  ownershipType: VehicleOwnershipType;
  capacity: number | null;
  plateNumber: string;
  insuranceExpiryDate: string | null;
  registrationExpiryDate: string | null;
  inspectionExpiryDate: string | null;
  createdAt: string;
}

export interface RiderReportRowRecord {
  id: number;
  riderCode: string;
  riderName: string;
  status: RiderStatus;
  riderType: RiderType;
  organizationId: number | null;
  wheelchairRequired: boolean;
  escortRequired: boolean;
  createdAt: string;
}

export interface RideReportRowRecord {
  id: number;
  rideNumber: string;
  status: RideStatus;
  serviceType: ServiceType;
  tripType: RideTripType;
  scheduledPickupAt: string | null;
  riderCode: string | null;
  riderName: string | null;
  driverCode: string | null;
  vehicleCode: string | null;
  organizationName: string | null;
}

export interface RouteReportRowRecord {
  id: number;
  routeCode: string;
  routeName: string;
  status: RouteStatus;
  serviceType: ServiceType;
  routeDate: string;
  assignedDriverCode: string | null;
  assignedVehicleCode: string | null;
}

export interface InvoiceReportRowRecord {
  id: number;
  invoiceNumber: string;
  status: InvoiceStatus;
  billToType: BillToType;
  billToName: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
}

export interface PaymentReportRowRecord {
  id: number;
  paymentNumber: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  amount: number;
  invoiceNumber: string | null;
  payerName: string | null;
  referenceNumber: string | null;
}

export interface ComplianceIssueReportRowRecord {
  id: number;
  entityType: ComplianceEntityType;
  entityCode: string;
  entityNameSummary: string;
  issueType: ComplianceIssueType;
  severity: ComplianceIssueSeverity;
  issueStatus: ComplianceIssueStatus;
  relatedDocumentType: string | null;
  expiryDate: string | null;
  updatedAt: string;
}

export interface IncidentReportRowRecord {
  id: number;
  incidentCode: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  status: IncidentWorkflowStatus;
  title: string;
  reportedAt: string | null;
  assignedToName: string | null;
  relatedRideCode: string | null;
  relatedDriverCode: string | null;
  relatedVehicleCode: string | null;
  updatedAt: string;
}

export interface ReportFilters {
  keyword?: string;
  status?: string;
  driverType?: DriverType;
  ownershipType?: VehicleOwnershipType;
  serviceType?: ServiceType | string;
  riderType?: RiderType;
  organizationId?: number;
  wheelchairRequired?: boolean;
  escortRequired?: boolean;
  riderId?: number;
  driverId?: number;
  billToType?: BillToType;
  overdueOnly?: boolean;
  paymentMethod?: PaymentMethod;
  entityType?: ComplianceEntityType;
  issueType?: ComplianceIssueType;
  severity?: string;
  issueStatus?: ComplianceIssueStatus;
  expiredOnly?: boolean;
  expiringSoonOnly?: boolean;
  incidentType?: IncidentType;
  assignedToUserId?: number;
  fromDate?: string;
  toDate?: string;
}

function getReport<T>(path: string, params: ReportFilters) {
  return apiClient
    .get(path, { params })
    .then((response) => unwrapResponse<CompanyReportResponse<T>>(response.data));
}

export const reportsApi = {
  async listDefinitions() {
    const response = await apiClient.get("/company/reports");
    return unwrapResponse<ReportDefinitionRecord[]>(response.data);
  },
  async getDriverReport(params: ReportFilters) {
    return getReport<DriverReportRowRecord>("/company/reports/drivers", params);
  },
  async getVehicleReport(params: ReportFilters) {
    return getReport<VehicleReportRowRecord>("/company/reports/vehicles", params);
  },
  async getRiderReport(params: ReportFilters) {
    return getReport<RiderReportRowRecord>("/company/reports/riders", params);
  },
  async getRideReport(params: ReportFilters) {
    return getReport<RideReportRowRecord>("/company/reports/rides", params);
  },
  async getRouteReport(params: ReportFilters) {
    return getReport<RouteReportRowRecord>("/company/reports/routes", params);
  },
  async getInvoiceReport(params: ReportFilters) {
    return getReport<InvoiceReportRowRecord>("/company/reports/invoices", params);
  },
  async getPaymentReport(params: ReportFilters) {
    return getReport<PaymentReportRowRecord>("/company/reports/payments", params);
  },
  async getComplianceReport(params: ReportFilters) {
    return getReport<ComplianceIssueReportRowRecord>("/company/reports/compliance", params);
  },
  async getIncidentReport(params: ReportFilters) {
    return getReport<IncidentReportRowRecord>("/company/reports/incidents", params);
  },
};