# ElimuPlus API Documentation

**Project:** ElimuPlus – Ganze NG-CDF Bursary Programme
**Document:** API Documentation
**Version:** 1.1
**Last updated:** 25 November 2026

---

## 1. Introduction

The ElimuPlus API provides backend services for managing bursary applications, user authentication, application reviews, school registration, bursary cycles, payment processing and privacy acknowledgements.

The backend uses Node.js and Express and communicates with the React frontend through HTTP requests.

## 2. Base URL

Local development:

```text
http://localhost:5000/api
```

### API route groups

| Route group | Base path | Purpose |
|---|---|---|
| Authentication | `/api/auth` | Registration, login and user profiles |
| Applications | `/api/applications` | Application submission, verification and approval |
| Administration | `/api/admin` | School management, bursary cycles and disbursement |
| Privacy | `/api/privacy` | Privacy acknowledgements |

## 3. Authentication and authorization

Protected endpoints require a valid JSON Web Token (JWT).

Include the token in the request header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### User roles

| Role | Responsibility |
|---|---|
| `applicant` | Registers, submits and views their own application |
| `agent` | Defined system role; no agent-specific endpoint is currently registered |
| `clerk` | Reviews applications and verifies supporting documents |
| `board` | Reviews verified applications and makes award decisions |
| `admin` | Performs administrative operations |

Access is controlled through authentication middleware (`protect`) and role-based authorization (`authorizeRoles`).

## 4. Authentication endpoints

Base path: `/api/auth`

| Method | Endpoint | Access |
|---|---|---|
| POST | `/register` | Public |
| POST | `/login` | Public |
| GET | `/profile` | Authenticated users |

### 4.1 Register a user

**Endpoint**

```http
POST /api/auth/register
```

Access: Public.

Request body:

```json
{
  "phoneNumber": "0712345678",
  "password": "your-password",
  "fullName": "Example Applicant",
  "nationalID": "12345678",
  "ward": "Ganze",
  "village": "Example Village"
}
```

Alternatively, use `birthCertificateNumber` instead of `nationalID`. Exactly one identification field must be provided.

Required fields:
- `phoneNumber`
- `password`
- `fullName`
- `ward`
- `village`
- Exactly one of `nationalID` or `birthCertificateNumber`

The public registration endpoint always creates an applicant account. A submitted role cannot be used to register as an administrator or another privileged user.

Successful response: HTTP 201.

The response includes the user's ID, phone number, role, full name and JWT.

Common errors:
- `400`: Missing required fields or invalid identification selection.
- `409`: Phone number or identification document already registered.
- `500`: Registration server error.

### 4.2 Login

**Endpoint**

```http
POST /api/auth/login
```

Access: Public.

Request body:

```json
{
  "phoneNumber": "0712345678",
  "password": "your-password"
}
```

Successful response includes:
- User ID
- Phone number
- Role
- Full name
- Ward
- JWT

Common errors:
- `400`: Phone number or password missing.
- `401`: Invalid phone number or password.
- `500`: Server error.

The JWT is generated with a 30-day expiry in the current controller.

### 4.3 Get user profile

**Endpoint**

```http
GET /api/auth/profile
```

Access: Authenticated users.

Header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Returns the authenticated user's profile. The password hash is excluded from the database query.

Common errors:
- `401`: Authentication failure.
- `404`: User profile not found.
- `500`: Server error.

## 5. Application endpoints

Base path: `/api/applications`

| Method | Endpoint | Access |
|---|---|---|
| POST | `/submit` | Applicant |
| GET | `/my-application` | Applicant |
| GET | `/review-queue` | Clerk, admin |
| PUT | `/:id/verify` | Clerk |
| GET | `/:id/documents/:documentType` | Clerk, admin |
| GET | `/board-queue` | Board, admin |
| PUT | `/:id/approve` | Board, admin |
| GET | `/public-ledger` | Public |

### 5.1 Submit a bursary application

**Endpoint**

```http
POST /api/applications/submit
```

Access: Applicant only.

Content type: `multipart/form-data`.

#### Required application fields

| Field | Description |
|---|---|
| `familyStatus` | Applicant's family status |
| `householdIncomeBracket` | Household income category |
| `schoolName` | Name of the school |
| `studentCategory` | Education category |
| `admissionNumber` | Student admission number |
| `outstandingFees` | Outstanding school fees |

Accepted `familyStatus` values:

- `total-orphan`
- `partial-orphan-single-parent`
- `both-parents-alive`

Accepted `studentCategory` values:

- `Primary`
- `Junior Secondary`
- `Senior Secondary`
- `TVET / Polytechnic`
- `College`
- `University`

Additional fields:

| Field | Description |
|---|---|
| `disabledParents` | Boolean indicating disability |
| `chronicIllnessInFamily` | Boolean indicating chronic illness in the family |
| `siblingsInSchool` | Number of siblings in school |

The two boolean values must be supplied as `true` or `false` (or their multipart string equivalents). `siblingsInSchool` defaults to zero if omitted.

#### Required supporting documents

All five PDF documents must be uploaded:

| Field name | Document |
|---|---|
| `chiefLetter` | Chief's Letter |
| `feeStructure` | School Fee Structure |
| `reportCard` | Academic Report Card |
| `parentIDOrDeathCertificate` | Parent ID or Death Certificate |
| `studentIDOrBirthCert` | Student ID or Birth Certificate |

Each document field must contain exactly one file.

#### Submission processing

The backend:
1. Checks the applicant's role.
2. Validates required application information.
3. Validates the five uploaded PDF documents.
4. Checks the application submission window.
5. Checks for an existing application for the current calendar year.
6. Uploads the documents to authenticated Cloudinary storage.
7. Calculates the application score and proposed award internally.
8. Saves the application.

Successful response: HTTP 201.

Example:

```json
{
  "message": "Application submitted successfully.",
  "applicationNumber": "GZ-2026-EXAMPLE123",
  "status": "Submitted"
}
```

Common errors:
- `400`: Missing fields, invalid values or missing documents.
- `401`: Authentication failure.
- `403`: User is not an applicant.
- `409`: Duplicate application.
- `500`: Submission failure.

### 5.2 Get my application

**Endpoint**

```http
GET /api/applications/my-application
```

Access: Applicant only.

Returns the authenticated applicant's application, including:

- Application number and status.
- Submission date.
- Education details.
- Vulnerability information.
- Safe supporting-document metadata.
- Safe document-review information.

The response does not expose Cloudinary public IDs, reviewer IDs, calculated scores or proposed award amounts.

Common errors:
- `401`: Authentication failure.
- `403`: Unauthorized role.
- `404`: Applicant has not submitted an application.
- `500`: Server error.

### 5.3 Get clerk review queue

**Endpoint**

```http
GET /api/applications/review-queue
```

Access: Clerk and admin.

Returns applications whose award status is `Submitted`, ordered by submission date.

The response includes application numbers, education details, document metadata and document-review information.

### 5.4 Verify or reject an application

**Endpoint**

```http
PUT /api/applications/:id/verify
```

Access: Clerk only.

Request body for verification:

```json
{
  "action": "Verified",
  "notes": "All supporting documents checked."
}
```

Request body for rejection:

```json
{
  "action": "Rejected",
  "notes": "The submitted supporting document is incomplete."
}
```

Accepted actions:
- `Verified`
- `Rejected`

Rules:
- A rejection must include a reason.
- Notes must be text.
- Notes cannot exceed 2,000 characters.
- The application must still be awaiting verification.

The clerk's decision applies to all five supporting documents. The operation also records an audit log.

Common errors:
- `400`: Invalid action, invalid application ID or invalid notes.
- `403`: User is not a clerk.
- `404`: Application not found.
- `409`: Application is no longer awaiting verification.
- `500`: Verification failure.

### 5.5 Retrieve a private application document

**Endpoint**

```http
GET /api/applications/:id/documents/:documentType
```

Access: Clerk and admin.

Accepted document types:

- `chiefLetter`
- `feeStructure`
- `reportCard`
- `parentIDOrDeathCertificate`
- `studentIDOrBirthCert`

The backend retrieves the private PDF from authenticated Cloudinary storage and streams it to the authorized client.

The signed Cloudinary download URL is not returned to the frontend.

Common errors:
- `400`: Invalid application ID or document type.
- `401`: Authentication failure.
- `403`: Insufficient permissions.
- `404`: Application or document not found.
- `502`: Unable to retrieve or validate the document.

### 5.6 Get board review queue

**Endpoint**

```http
GET /api/applications/board-queue
```

Access: Board and admin.

Returns applications with award status `Verified`.

The response includes:
- Application number and status.
- Education details.
- Vulnerability metrics.
- Calculated score.
- Proposed award amount.
- Safe document metadata and review information.

This queue contains confidential assessment information and is restricted to authorized board and admin users.

### 5.7 Approve or reject an award

**Endpoint**

```http
PUT /api/applications/:id/approve
```

Access: Board and admin.

Request body for approval:

```json
{
  "action": "Approved",
  "notes": "Application approved after board review."
}
```

Request body for rejection:

```json
{
  "action": "Rejected",
  "notes": "Reason for rejecting the bursary award."
}
```

Accepted actions:
- `Approved`
- `Rejected`

Rules:
1. The application must have status `Verified`.
2. All five supporting documents must have status `Verified`.
3. Rejection requires a reason.
4. The server calculates the award amount; the client cannot supply or manipulate it.
5. The calculated award must not exceed the outstanding school fees.
6. The board decision is recorded in the audit log.

An approved application receives status `Board-Approved`. Approval does not mean that payment has been completed.

The response deliberately does not disclose the confidential approved award amount.

Common errors:
- `400`: Invalid action, ID or notes.
- `403`: Insufficient permissions.
- `404`: Application not found.
- `409`: Application is not awaiting board approval, documents are not all verified, or award exceeds outstanding fees.
- `500`: Board decision failure.

### 5.8 Get public transparency ledger

**Endpoint**

```http
GET /api/applications/public-ledger
```

Access: Public.

Returns selected transaction information:

- School name.
- School category.
- Amount disbursed.
- Transaction date.

Example response structure:

```json
{
  "message": "Public transparency ledger fetched successfully.",
  "count": 1,
  "data": [
    {
      "school": {
        "schoolName": "Example School",
        "category": "Secondary"
      },
      "amountDisbursed": 15000,
      "date": "2026-11-25T10:00:00.000Z"
    }
  ]
}
```

Applicant identity information and private documents are not included.

## 6. Administration endpoints

Base path: `/api/admin`

| Method | Endpoint | Access |
|---|---|---|
| POST | `/schools` | Admin |
| GET | `/getleaderboard` | Admin |
| POST | `/set-cycle` | Admin |
| GET | `/active-cycle` | Public |
| POST | `/disburse-batch` | Admin |
| POST | `/test-confirm-payment/:paymentReference` | Admin, non-production only |

### 6.1 Register a school

**Endpoint**

```http
POST /api/admin/schools
```

Access: Admin only.

Request body:

```json
{
  "schoolName": "Example Secondary School",
  "category": "Secondary",
  "bankDetails": {
    "bankName": "Example Bank",
    "branchName": "Mombasa Branch",
    "accountNumber": "123456789",
    "paybillNumber": "123456"
  },
  "contactEmail": "school@example.com",
  "contactPhone": "0712345678"
}
```

Required fields:
- `schoolName`
- `category`
- `bankDetails.bankName`
- `bankDetails.branchName`
- `bankDetails.accountNumber`
- `contactEmail`
- `contactPhone`

`bankDetails.paybillNumber` is optional.

The backend checks for duplicate school names.

Successful response: HTTP 201.

The response intentionally excludes bank account details.

Common errors:
- `400`: Missing or invalid school details.
- `401`: Authentication failure.
- `403`: Insufficient permissions.
- `409`: School or unique field already registered.
- `500`: Registration failure.

### 6.2 Get application leaderboard

**Endpoint**

```http
GET /api/admin/getleaderboard
```

Access: Admin only under the current route configuration.

Returns applications with award status `Verified`, sorted by calculated score in descending order.

The controller contains conditional logic for including scores for board or admin users. However, the route currently authorizes only admins, so board users cannot access this endpoint through the registered route.

### 6.3 Configure bursary cycle

**Endpoint**

```http
POST /api/admin/set-cycle
```

Access: Admin only.

Request body:

```json
{
  "cycleName": "Ganze NG-CDF Bursary Cycle 2026/2027",
  "openingDate": "2026-10-16T00:00:00.000Z",
  "closingDate": "2026-12-01T23:59:59.000Z"
}
```

Required fields:
- `cycleName`
- `openingDate`
- `closingDate`

Rules:
- Cycle name must be a non-empty string.
- Both dates must be valid.
- Closing date must be later than opening date.

The backend deactivates existing periods, clears the active-cycle cache and creates the new active period.

Successful response: HTTP 201.

Common errors:
- `400`: Missing or invalid cycle details.
- `401`: Authentication failure.
- `403`: Insufficient permissions.
- `500`: Cycle configuration failure.

### 6.4 Get active bursary cycle

**Endpoint**

```http
GET /api/admin/active-cycle
```

Access: Public under the current route configuration.

Returns the active bursary cycle and whether the application window is currently open.

Example response:

```json
{
  "message": "Active bursary cycle retrieved successfully.",
  "data": {
    "cycleName": "Ganze NG-CDF Bursary Cycle 2026/2027",
    "openingDate": "2026-10-16T00:00:00.000Z",
    "closingDate": "2026-12-01T23:59:59.000Z",
    "isActive": true,
    "applicationWindowOpen": true
  }
}
```

If no active cycle exists:

```json
{
  "message": "No active bursary cycle is configured.",
  "data": null,
  "applicationWindowOpen": false
}
```

The endpoint uses caching to reduce repeated database queries.

### 6.5 Initiate batch disbursement

**Endpoint**

```http
POST /api/admin/disburse-batch
```

Access: Admin only.

Request body:

```json
{
  "applicationIds": [
    "APPLICATION_MONGODB_ID_1",
    "APPLICATION_MONGODB_ID_2"
  ]
}
```

Rules:
- `applicationIds` must be a non-empty array.
- Maximum of 100 applications per batch.
- Every ID must be a valid MongoDB ObjectId.
- Duplicate IDs in one batch are rejected.
- Applications must have status `Board-Approved`.
- A valid approved amount and linked school must exist.
- A pending or completed transaction must not already exist for the application.

The backend creates pending transaction records and returns a batch reference, pending count and failed count.

**Important:** This endpoint initiates transaction records. It does not itself confirm a payment or transfer real money.

### 6.6 Simulate payment confirmation

**Endpoint**

```http
POST /api/admin/test-confirm-payment/:paymentReference
```

Access: Admin only.

Availability: Development and testing environments only.

Purpose: Simulates confirmation of a pending transaction.

The backend:
- Finds the transaction by payment reference.
- Requires the transaction to be `Pending`.
- Marks the transaction `Completed`.
- Marks the associated board-approved application `Disbursed`.
- Records an audit log.
- Marks the transaction `simulationOnly: true`.

The response explicitly states that no real funds were transferred.

This endpoint is not registered in production.

## 7. Privacy endpoints

Base path: `/api/privacy`

| Method | Endpoint | Access |
|---|---|---|
| POST | `/acknowledgement` | Authenticated applicant |
| GET | `/my-acknowledgement` | Authenticated users |

### 7.1 Record privacy acknowledgement

**Endpoint**

```http
POST /api/privacy/acknowledgement
```

Access: Authenticated applicants.

Request body for an adult applicant:

```json
{
  "applicantType": "adult",
  "acknowledged": true
}
```

Request body for a minor applicant:

```json
{
  "applicantType": "minor",
  "acknowledged": true,
  "guardian": {
    "fullName": "Example Guardian",
    "relationship": "Parent",
    "phoneNumber": "0712345678",
    "consentGiven": true
  }
}
```

Accepted applicant types:
- `adult`
- `minor`

Accepted guardian relationships:
- `Parent`
- `Legal Guardian`

Rules:
- Acknowledgement must explicitly be `true`.
- Minor applicants must provide guardian details.
- Guardian consent must explicitly be `true`.
- Duplicate acknowledgements for the current notice version are rejected unless the previous record has been withdrawn.

The current notice version is read from `PRIVACY_NOTICE_VERSION`, defaulting to `1.0`.

Successful response: HTTP 201.

For minors, the acknowledgement status becomes `Guardian-Verification-Pending`. Adult acknowledgements are recorded with status `Recorded`.

Common errors:
- `400`: Invalid applicant type, missing guardian information or acknowledgement not given.
- `401`: Authentication required.
- `403`: User is not an applicant.
- `409`: Current notice has already been acknowledged.
- `500`: Recording failure.

### 7.2 Get my privacy acknowledgement

**Endpoint**

```http
GET /api/privacy/my-acknowledgement
```

Access: Authenticated users.

Returns the latest privacy acknowledgement belonging to the authenticated user.

Common errors:
- `401`: Authentication required.
- `404`: No acknowledgement found.
- `500`: Retrieval failure.

## 8. Endpoint summary

| Route group | Endpoints |
|---|---:|
| Authentication | 3 |
| Applications | 8 |
| Administration | 6 |
| Privacy | 2 |
| **Total** | **19** |

The payment simulation endpoint is included in this total but is only registered outside production.

## 9. Common HTTP status codes

| Status | Meaning |
|---|---|
| 200 | Request completed successfully |
| 201 | Resource created successfully |
| 400 | Invalid request or validation failure |
| 401 | Authentication required or invalid |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict with an existing record or workflow state |
| 429 | Too many requests |
| 500 | Internal server error |
| 502 | Upstream document retrieval failure |

Not every endpoint uses every status code. The exact response depends on its controller and middleware.

## 10. Security controls

The API currently implements:

1. JWT authentication for protected routes.
2. Role-based authorization.
3. Rate limiting for registration, login and application submission.
4. Application-window validation.
5. Duplicate application prevention.
6. Restricted access to supporting documents.
7. Private Cloudinary document retrieval.
8. Safe response construction to avoid exposing selected confidential information.
9. Audit logging for clerk decisions, board decisions and simulated disbursement.
10. Development-only payment simulation.

## 11. Important implementation notes

- This documentation is based on the Express route definitions and controller implementations inspected on 25 November 2026.
- Request and response structures should be updated whenever the corresponding controllers change.
- The active-cycle endpoint is public in the current configuration.
- The public transparency ledger is intentionally public and returns selected transaction information.
- The leaderboard currently permits only admins through its route, despite additional conditional logic in the controller.
- The board review queue exposes confidential assessment information only to board and admin users.
- Batch disbursement creates pending transactions; it does not prove that money has been transferred.
- The payment simulation endpoint must remain unavailable in production.
- The current API does not show a separate version prefix such as `/api/v1`.

---

**ElimuPlus – Ganze's Future**

*Supporting transparent, accountable and accessible bursary management.*