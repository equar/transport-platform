# Vehicle ownership

The fleet supports **company-owned**, **driver-owned**, and the existing **leased** ownership category. Ownership and operating assignment are separate fields.

## Register or edit a vehicle

In the company admin portal, open **Vehicles → Create Vehicle** (or edit an existing vehicle):

- Choose **Company owned** for the transport provider's fleet. An assigned driver is optional.
- Choose **Driver owned** and select the **Owning driver** by name/code. The owner must be a driver in the same tenant. Select an operating **Assigned driver** separately when needed.
- Changing an assignment does not change the owner. Switching to company/leased ownership clears the driver owner.

The server enforces these rules for API clients too. Both owner and assignment references are checked against the current tenant. A composite database foreign key also prevents a vehicle owner from referring to another tenant's driver.

## Driver experience

The web driver profile and mobile **My vehicles** view list only vehicles owned by or assigned to the signed-in driver, within that driver's tenant. Labels distinguish **Owned by you** from **Company owned** and indicate the current operating assignment. The mobile view includes capacity, registration, insurance and inspection dates. The driver-facing response excludes internal fleet notes, VINs and insurance policy numbers.

Fleet administrators maintain the records and supporting vehicle documents. This change does not introduce driver self-registration/approval or alter ride dispatch permissions. Dispatch assignments remain operational decisions separate from legal ownership.

## Existing records and test data

Migration V11 adds the nullable owner field and tenant-constrained foreign key without guessing ownership from an existing operating assignment. An existing driver-owned record with no explicit owner must have an owner selected before it can be saved/activated. Company-owned and leased records retain their existing data.

The QA dataset generator now creates five company-owned and five driver-owned vehicles per tenant. The live fixture update touches only unchanged, marked QA vehicles `QA-V06`–`QA-V10`, explicitly linking each to its matching QA driver. User-edited test vehicles and non-test fleet records are preserved.

## Validation

Ownership/assignment rules, admin form behavior, driver vehicle presentation, tenant-scoped queries and the database foreign key are covered by tests. The full backend suite passed 192 tests, frontend suite 21, and mobile suite 25. Native Android packaging and live rollout results are recorded after verification below.

The backend release `vehicle-ownership-1794055576` and frontend release `vehicle-ownership-ui-1794055729` are live. All 50 untouched QA vehicle updates succeeded, leaving five vehicles of each ownership type in every test tenant. Live checks confirmed scoped driver visibility, ownership filters, rejection of missing/foreign owners and omission of internal vehicle details from driver responses. Validation probes created no vehicles.

Use `samuelweld2018+dt0101@gmail.com` to test a company-assigned vehicle or `samuelweld2018+dt0106@gmail.com` to test a driver-owned vehicle, with the existing QA password. Install the [updated Android APK](../mobile/build/transport-platform-vehicle-ownership.apk) for the mobile vehicle view. The standalone ARM64/ARMv7 release package and its signature were verified; this follow-up was not installed on a physical device. It uses the local test signing identity, not a Play Store signing identity.
