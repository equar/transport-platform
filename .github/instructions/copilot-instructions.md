Kirshi Transport Platform — GitHub Copilot Instructions
Purpose

These instructions guide GitHub Copilot when generating or modifying code for the Transport SaaS Platform.

The system is:

Multi-tenant SaaS
Enterprise-grade
Production-ready
Modular architecture

Copilot must:

Review existing implementation first
Make minimal safe changes
Maintain architecture consistency
Avoid demo-style code
Architecture Principles
Backend
Spring Boot
Package by feature
DTO-based API layer
Service layer business logic
Repository layer persistence
Global exception handling
Audit fields on all entities

All entities must include:

id
tenantId (when applicable)
status
createdBy
createdAt
updatedBy
updatedAt
Multi‑Tenant Requirements

Always:

Enforce tenantId filtering
Prevent cross‑tenant access
Validate tenant ownership
Scope queries to tenant

Never:

Return cross‑tenant data
Accept tenantId from frontend

Tenant must be resolved from:

Authenticated user
Security context
Status Handling

Use enum based status

Examples:

ACTIVE
INACTIVE
PENDING
SUSPENDED
CANCELLED

Never use raw strings

Validation Rules

Use:

Bean validation
Service level validation

Validate:

tenant ownership
status transitions
required fields
numeric ranges
dates
API Standards

Controllers:

RESTful endpoints
Proper HTTP status
Pagination support
Filtering support

Naming:

/api/drivers
/api/rides
/api/invoices
Pagination Standards

Use:

page
size
sort

Return:

content
totalElements
totalPages
Search Standards

Always support:

keyword

Frontend may send empty keyword

Backend must handle gracefully

Logging

Log:

creation
updates
deletes
assignments

Do not log sensitive data

Frontend Standards

React + TypeScript + Material UI

Use:

Reusable components
Tables
Dialogs
Forms
Chips
UX Requirements

Always include:

loading states
empty states
error states
Security Rules

Never:

expose internal ids unnecessarily
trust frontend data

Always validate backend

Production Quality

Code must be:

maintainable
scalable
clean
consistent

Avoid:

TODO placeholders
demo shortcuts
