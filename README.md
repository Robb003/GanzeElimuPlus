# ElimuPlus – Ganze NG-CDF Bursary Management System

**Ganze's Future | Digital Bursary Application and Management Platform**

## 1. Project Overview

ElimuPlus is a web-based bursary management system designed to digitize and improve the administration of the Ganze NG-CDF Bursary Programme in Kilifi County, Kenya.

The platform aims to simplify bursary applications, streamline document verification, strengthen approval processes and improve financial accountability through secure, role-based access and an auditable application workflow.

ElimuPlus provides a centralized platform through which applicants submit bursary applications while authorized officers review, verify and process applications.

## 2. Project Objectives

- Digitize the bursary application process.
- Improve transparency and accountability in bursary allocation.
- Ensure applicants submit the required supporting documents.
- Enable authorized clerks to review and verify applications.
- Enable the bursary board to make approval and rejection decisions.
- Maintain an audit trail of important administrative actions.
- Strengthen access control and protection of applicant information.
- Support accurate bursary award and payment management.

## 3. Key Features

### Applicant Management
- Secure applicant registration and login.
- Applicant profile management.
- Bursary application submission.
- Supporting document uploads.
- Application status tracking.

### Document Verification
The system supports five required document categories:

1. Chief's Letter.
2. School Fee Structure.
3. Academic Report Card.
4. Parent's ID or Death Certificate.
5. Student's ID or Birth Certificate.

### Clerk Management
- Access to submitted applications.
- Application review queue.
- Supporting document verification.
- Document rejection with review notes.
- Recorded verification decisions.

### Board Management
- Access to applications that have completed document verification.
- Application approval and rejection.
- Bursary award decision management.
- Protection against unauthorized or duplicate decisions.

### Administration and Accountability
- Role-based access control.
- Audit logging.
- Application lifecycle management.
- Financial accountability and payment tracking.

## 4. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Backend | Node.js |
| API Framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JSON Web Tokens (JWT) |
| Password Security | bcrypt |
| Document Storage | Cloudinary |
| API Communication | Axios |
| Testing | Jest and Supertest |

## 5. User Roles

ElimuPlus implements role-based access control (RBAC).

| Role | Responsibility |
|---|---|
| Applicant | Submits and tracks bursary applications |
| Agent | Authorized operational functions |
| Clerk | Reviews applications and verifies documents |
| Board | Makes bursary award decisions |
| Admin | Oversees system administration |

Access to protected resources is determined by the user's assigned role.

## 6. Application Workflow

The intended application lifecycle is:

1. Applicant registers and logs in.
2. Applicant submits a bursary application.
3. Applicant uploads the required supporting documents.
4. Clerk reviews the application and verifies documents.
5. Verified applications proceed to the board.
6. Board evaluates and makes an award decision.
7. Approved applications proceed to the appropriate payment process.
8. Important actions are recorded in the audit trail.

## 7. Project Structure

```text
ElimuPlus/
│
├── client/                 # React frontend
│
├── server/                 # Express backend
│   ├── Config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── test/
│   └── app.js
│
├── docs/                   # Detailed documentation
│
└── README.md
```

## 8. Installation and Setup

### Prerequisites

- Node.js
- pnpm
- MongoDB
- Git
- Cloudinary account for document storage

### Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd ElimuPlus
```

### Backend setup

```bash
cd server
pnpm install
```

Configure the backend environment variables in a `.env` file.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the backend:

```bash
pnpm dev
```

### Frontend setup

Open another terminal:

```bash
cd client
pnpm install
pnpm dev
```

The frontend development server will display its local URL in the terminal.

## 9. Testing

Backend automated tests:

```bash
cd server
pnpm test
```

The backend test suite uses Jest and Supertest.

## 10. Security Considerations

ElimuPlus incorporates security measures including:

- JWT-based authentication.
- Password hashing.
- Role-based authorization.
- Server-side application validation.
- Protected administrative endpoints.
- Document upload restrictions.
- Controlled disclosure of sensitive application information.
- Audit logging of administrative decisions.

Never commit `.env` files, credentials, private keys or sensitive applicant information to version control.

## 11. Project Status

**Development status:** Active development.

The project has implemented core authentication, application management, document verification and clerk review functionality. Board workflows, administrative features, financial processing and final deployment are subject to ongoing development and verification.

## 12. Future Improvements

- Complete board and administrative dashboards.
- Full bursary payment reconciliation.
- Improved reporting and analytics.
- Enhanced notifications.
- Production deployment and monitoring.
- Comprehensive user and administrator documentation.

## 13. Project Mission

ElimuPlus aims to promote transparency, efficiency and accountability in bursary administration while improving access to educational financial assistance for eligible learners in Ganze Sub-County.

---

**Project:** ElimuPlus
**Programme:** Ganze NG-CDF Bursary Programme
**Location:** Ganze Sub-County, Kilifi County, Kenya
**Repository:** To be linked