# 🚀 Let'sTravel Server

## Online Ticket Booking Platform - Backend API

**Let'sTravel Server** is the backend API for the Let'sTravel Online Ticket Booking Platform.

It provides secure backend services for:

- 👤 User
- 🧑‍💼 Vendor
- 🛡️ Admin

The server handles ticket management, transport-specific seat generation, bookings, seat reservations, user roles, payments, transactions, Vendor revenue analytics, advertisements, and Admin moderation.

---

## 🌐 Live URL

**Live Server:**  
YOUR_SERVER_LIVE_URL

**Live Client:**  
YOUR_CLIENT_LIVE_URL

Example:

```text
Server:
https://your-letstravel-server.vercel.app

Client:
https://your-letstravel-client.vercel.app
```

---

## 🎯 Project Purpose

The purpose of the Let'sTravel backend is to provide a secure and organized API for the complete travel ticket booking workflow.

The server manages:

- User information
- User roles
- Vendor permissions
- Ticket creation
- Ticket verification
- Transport seat/cabin layouts
- Seat availability
- Booking requests
- Vendor booking decisions
- Stripe payments
- Transactions
- Revenue statistics
- Advertisements
- Fraud Vendor protection

The backend is designed to support the complete booking lifecycle from ticket creation to successful payment.

---

# ⭐ Key Features

## 🔐 Authentication & Authorization

The server protects private APIs using authentication and role-based authorization.

Supported roles:

```text
User
Vendor
Admin
```

Features include:

- Authenticated API access
- JWT/JWKS verification
- Better Auth compatible authentication
- Role-based middleware
- User route protection
- Vendor route protection
- Admin route protection
- Secure access to private resources

---

## 👤 User Management

The server supports:

- Synchronizing authenticated Users
- Getting current User Profile
- Updating Profile Photo
- Viewing all Users for Admin
- Updating User role
- Promoting User to Vendor
- Promoting User to Admin
- Marking Vendor as Fraud

Example roles:

```text
user
vendor
admin
```

New registered users receive the default role:

```text
user
```

---

# 🧑 Profile Photo Management

Users can maintain an optional custom profile picture.

Example route:

```text
PATCH /api/users/me/profile-image
```

The backend stores the custom profile image URL.

If no custom image is stored, the frontend automatically displays initials generated from the user's name.

Example:

```text
Let'sTravel Admin  → LA
Let'sTravel Vendor → LV
Rahim Uddin        → RU
```

---

# 🎟️ Ticket Management

The backend supports the complete ticket management process.

Vendors can:

- Add Ticket
- View their own Tickets
- Update Ticket
- Delete Ticket

Admins can:

- View Tickets
- Approve Ticket
- Reject Ticket
- Advertise Ticket
- Unadvertise Ticket

Public users can see Admin-approved tickets.

Ticket verification statuses include:

```text
pending
approved
rejected
```

---

# 💺 Dynamic Transport-Specific Seat System

One of the main special features of Let'sTravel is the dynamic seat and cabin system.

Different transport types use different booking structures.

---

## 🚌 Bus Seat System

Bus layouts support:

```text
HD - High Deck
LD - Low Deck
DD - Double Decker
```

Seat layouts include:

```text
2 + 2
2 + 1 Business
Sleeper
```

Example:

```text
Bus Type: HD
Layout: 2 + 2
Rows: 10

Generated Seats:
40
```

For Double Decker buses, seat IDs can represent different decks.

---

## ✈️ Plane Seat System

Plane layouts support:

- 3 + 3 seating
- 2 + 2 seating
- Business rows
- Economy rows
- Exit rows
- Window seats
- Middle seats
- Aisle seats

Example:

```text
Business Class

1A  1B       1C  1D

Economy Class

3A  3B  3C       3D  3E  3F

--------- EXIT ROW ---------

6A  6B  6C       6D  6E  6F
```

---

## 🚆 Train Seat System

Train layouts support:

- Multiple Coaches
- 2 + 2 seating
- 2 + 1 seating
- Berth / Sleeper
- Coach-specific seat IDs

Classes can include:

```text
Shovon Chair
Snigdha
AC Seat
AC Berth
```

Example seat IDs:

```text
Coach A

A-1A
A-1B
A-1C
A-1D

Coach B

B-1A
B-1B
B-1C
B-1D
```

Berth-style units may use IDs such as:

```text
A-1L1
A-1U1
```

---

## 🚢 Cruise / Launch System

Cruise / Launch booking supports:

- Single Cabin
- Double Cabin
- Family Cabin
- Chair Seat
- Deck Seat

Example:

```text
SC-01 = Single Cabin

DC-01 = Double Cabin

FC-01 = Family Cabin

CH-001 = Chair Seat

DK-001 = Deck Seat
```

---

# 🔢 Automatic Ticket Quantity Generation

The backend supports ticket quantity based on the Vendor's selected layout configuration.

Example:

```text
Bus Layout:
2 + 2

Rows:
10

Seats Per Row:
4

Generated Quantity:
40
```

The same concept is used for:

- Bus seats
- Plane seats
- Train seats
- Train coaches
- Train berths
- Cruise cabins
- Cruise chairs
- Deck seats

This reduces manual quantity calculation.

---

# 🟢 Seat Availability Management

Seats or cabins can have different availability states.

The server determines whether a booking unit is:

```text
Available
Reserved
Booked
```

The frontend additionally represents the current user's temporary choice as:

```text
Selected
```

Typical flow:

```text
Available
    ↓
Selected
    ↓
Pending Booking
    ↓
Reserved
    ↓
Vendor Accepted
    ↓
Payment Successful
    ↓
Booked
```

---

# 🛡️ Seat Conflict Protection

Seat availability is validated on the backend before a booking is created.

This prevents two users from successfully reserving the same seat or cabin.

Example:

```text
User A selects 2A
        ↓
Server validates 2A
        ↓
Booking reserves 2A
        ↓
User B cannot successfully reserve 2A
```

This is important because frontend validation alone is not enough for secure seat booking.

---

# ♻️ Automatic Seat Release

Reserved seats do not remain blocked permanently when a booking is cancelled or rejected.

Example:

```text
Pending Booking
      ↓
User Cancels
      ↓
Seat Becomes Available
```

or:

```text
Pending Booking
      ↓
Vendor Rejects
      ↓
Seat Becomes Available
```

This keeps seat availability synchronized with the booking workflow.

---

# 📚 Booking Management

The backend manages booking requests between Users and Vendors.

Booking statuses include:

```text
pending
accepted
rejected
paid
```

Typical booking flow:

```text
User Selects Seat
       ↓
Creates Booking Request
       ↓
Pending
       ↓
Vendor Reviews Request
       ↓
Accepted
       ↓
User Pays
       ↓
Paid
```

Alternative flow:

```text
Pending
   ↓
Rejected
```

---

# ❌ Booking Cancellation

Users can cancel a booking while the booking status is:

```text
pending
```

After a Vendor accepts the booking, cancellation is no longer available through the normal Pending cancellation flow.

Example:

```text
Pending
→ Cancellation Allowed

Accepted
→ Cancellation Not Available

Paid
→ Cancellation Not Available
```

---

# 🧑‍💼 Vendor Booking Decisions

Vendors can manage booking requests associated with their tickets.

For a Pending booking, Vendor actions include:

```text
Accept
Reject
```

After the decision, the booking status is updated.

Example:

```text
Pending
    ↓
Accept
    ↓
Accepted
```

or:

```text
Pending
    ↓
Reject
    ↓
Rejected
```

---

# 💳 Stripe Payment Integration

Let'sTravel uses Stripe for payment processing.

The backend handles:

- Stripe Checkout Session creation
- Booking validation before payment
- BDT currency
- Successful payment confirmation
- Transaction creation
- Booking status update
- Duplicate payment protection

Stripe currency:

```js
currency: "bdt"
```

Example amount conversion:

```js
unit_amount: Math.round(
  Number(amount) * 100
);
```

---

# 🇧🇩 Bangladeshi Taka Support

The platform uses:

```text
BDT - Bangladeshi Taka
```

Examples:

```text
৳850
৳1,200
৳7,200
৳48,800
```

The database stores monetary amounts as numbers while the frontend formats them with the Taka symbol.

---

# 🧾 Transaction Management

After successful payment, transaction information can be stored for future reference.

Transaction data may include:

- Transaction ID
- Booking ID
- Ticket ID
- Ticket Title
- Passenger Name
- Passenger Email
- From
- To
- Departure Date
- Selected Seats / Cabins
- Quantity
- Unit Price
- Total Amount
- Currency
- Payment Date
- Payment Status

The frontend uses this information for Transaction History and PDF Ticket generation.

---

# 📄 PDF Ticket Data Support

The backend provides the booking and transaction data required by the frontend to create a PDF ticket.

The generated ticket can contain:

```text
Let'sTravel

Passenger Name
Passenger Email

Ticket Title
From → To

Departure Date
Seat / Cabin Number

Quantity
Total Amount

Booking ID
Transaction ID

Status: Paid
```

PDF generation is handled on the client using jsPDF.

---

# 📊 Vendor Revenue Analytics

The backend provides Vendor performance statistics.

Revenue statistics include:

- Total Tickets Added
- Total Tickets Sold
- Total Revenue
- Monthly Revenue

Example:

```text
Tickets Added:
15

Tickets Sold:
6

Total Revenue:
৳48,800
```

Monthly data is used by the frontend to generate Revenue Charts.

---

# 🛡️ Admin Ticket Verification

Vendor-created tickets can be moderated by Admin.

Flow:

```text
Vendor Adds Ticket
       ↓
Pending
       ↓
Admin Reviews
      ↙ ↘
 Approved  Rejected
```

Only approved tickets should appear in public ticket discovery.

---

# 👥 Admin User Management

Admins can manage registered users.

Admin functionality includes:

- View Users
- View User Name
- View User Email
- View User Role
- Promote User to Vendor
- Promote User to Admin
- Mark Vendor as Fraud

---

# 🚨 Fraud Vendor Protection

Admin can mark a Vendor as Fraud.

When a Vendor is marked as fraudulent:

```text
Vendor
   ↓
isFraud = true
   ↓
Vendor Tickets Hidden
   ↓
Advertised Tickets Removed
   ↓
Vendor Restricted
```

This helps prevent suspicious Vendor content from remaining publicly visible.

---

# 📢 Advertisement Management

Admins can control which approved tickets are promoted on the homepage.

Available actions:

```text
Advertise
Unadvertise
```

The platform limits advertisements to:

```text
Maximum 6 advertised tickets
```

This prevents unlimited homepage advertisement entries.

---

# 🔐 Role-Based Authorization

Different server routes are protected according to User role.

---

## 👤 User Permissions

Users can perform actions such as:

```text
View Approved Tickets
View Ticket Details
Create Booking
View Own Bookings
Cancel Pending Booking
Pay Accepted Booking
View Own Transactions
Update Own Profile Photo
```

---

## 🧑‍💼 Vendor Permissions

Vendors can perform actions such as:

```text
Add Ticket
View Own Tickets
Update Own Ticket
Delete Own Ticket
View Booking Requests
Accept Booking
Reject Booking
View Revenue Statistics
```

---

## 🛡️ Admin Permissions

Admins can perform actions such as:

```text
View All Users
Change User Roles
Approve Tickets
Reject Tickets
Advertise Tickets
Unadvertise Tickets
Mark Vendor as Fraud
```

---

# 🔒 Security Specialities

Security and validation are handled on the server instead of relying only on frontend controls.

Important validations include:

- Authentication verification
- Role verification
- User ownership validation
- Vendor ownership validation
- Seat availability validation
- Booking status validation
- Payment eligibility validation
- Duplicate seat protection
- Duplicate payment protection
- Fraud Vendor restriction
- Environment variable protection

The frontend does not determine sensitive authorization decisions by itself.

---

# 🌟 Unique Backend Features

Some of the special backend features implemented in Let'sTravel include:

- Transport-specific seat generation
- Bus HD / LD / DD support
- Plane Business/Economy seat support
- Plane Exit Row configuration
- Train Coach-specific seating
- Train Berth support
- Cruise Cabin booking
- Chair and Deck booking
- Automatic ticket quantity
- Real seat reservation
- Seat conflict validation
- Automatic seat release
- Booking lifecycle management
- Vendor booking approval
- Stripe BDT payment
- Transaction storage
- Revenue analytics
- Fraud Vendor protection
- Advertisement limits
- Profile image management
- Role-based API security

---

# 🧠 Backend Work Specialities

The backend is more than a standard CRUD API.

It connects multiple business processes together.

---

## 1. Complete Booking Lifecycle

```text
Ticket
   ↓
Seat Generation
   ↓
Seat Selection
   ↓
Booking
   ↓
Vendor Approval
   ↓
Payment
   ↓
Transaction
   ↓
Paid Ticket
```

---

## 2. Real-World Transport Modelling

Instead of treating every transport as identical, the backend supports different travel models.

```text
Bus
→ Deck + Seat Layout

Plane
→ Business + Economy + Exit Rows

Train
→ Coaches + Classes + Berths

Cruise
→ Cabins + Chairs + Deck Seats
```

---

## 3. Backend Business Validation

Critical business rules are validated by the server.

Examples:

```text
Is the User authenticated?

Does the User own this booking?

Does the Vendor own this ticket?

Is the seat still available?

Is the booking Pending?

Is payment allowed?

Is the Vendor fraudulent?

Has this payment already been confirmed?
```

---

## 4. Automated Data Processing

The backend helps automate:

- Seat generation
- Ticket quantity
- Seat availability
- Booking status
- Transaction creation
- Revenue statistics
- Fraud ticket hiding
- Advertisement management

---

# 🛠️ Technologies Used

- Node.js
- Express.js
- JavaScript
- MongoDB
- MongoDB Native Driver
- Better Auth compatible authentication
- JWT / JWKS
- Stripe
- CORS
- dotenv

---

# 📦 NPM Packages Used

Major npm packages used in the server may include:

```text
express
mongodb
cors
dotenv
jose
jsonwebtoken
stripe
nodemon
```

For the exact package names and installed versions, check:

```text
package.json
```

---

# ⚙️ Environment Variables

Create a `.env` file in the server project root.

Example:

```env
PORT=5000

MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING

DB_NAME=YOUR_DATABASE_NAME

CLIENT_URL=http://localhost:3000

BETTER_AUTH_JWKS_URL=http://localhost:3000/api/auth/jwks

BETTER_AUTH_ISSUER=http://localhost:3000

BETTER_AUTH_AUDIENCE=http://localhost:3000

STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY

STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET
```

Your exact environment variables should match your final server code.

> Never upload the real `.env` file to GitHub.

---

# ⚙️ Local Installation

## 1. Clone Server Repository

```bash
git clone YOUR_SERVER_GITHUB_REPOSITORY
```

---

## 2. Enter Server Folder

```bash
cd YOUR_SERVER_PROJECT_FOLDER
```

---

## 3. Install Dependencies

```bash
npm install
```

---

## 4. Create Environment File

Create:

```text
.env
```

and add the required environment variables.

---

## 5. Start Development Server

```bash
npm run dev
```

or, depending on the configured scripts:

```bash
npm start
```

Default server URL:

```text
http://localhost:5000
```

Default API URL:

```text
http://localhost:5000/api
```

---

# 🌐 Main API Groups

The Let'sTravel server contains API groups for:

```text
/api/users

/api/tickets

/api/bookings

/api/payments

/api/stats
```

---

# 👤 User APIs

Examples:

```text
POST   /api/users/sync

GET    /api/users/me

PATCH  /api/users/me/profile-image

GET    /api/users

PATCH  /api/users/:id/role

PATCH  /api/users/:id/fraud
```

---

# 🎟️ Ticket APIs

Main Ticket APIs include operations for:

```text
GET Ticket(s)

GET Ticket Details

POST New Ticket

PATCH Ticket

DELETE Ticket

Approve / Reject Ticket

Advertise / Unadvertise Ticket
```

Example patterns:

```text
GET     /api/tickets

GET     /api/tickets/:id

POST    /api/tickets

PATCH   /api/tickets/:id

DELETE  /api/tickets/:id
```

The exact route paths should follow the final server implementation.

---

# 📚 Booking APIs

Booking APIs support:

```text
Create Booking

Get User Bookings

Get Vendor Requested Bookings

Accept Booking

Reject Booking

Cancel Pending Booking
```

Typical route patterns include:

```text
POST   /api/bookings

GET    /api/bookings/mine

GET    /api/bookings/requested

PATCH  /api/bookings/:id/status

PATCH  /api/bookings/:id/cancel
```

---

# 💳 Payment APIs

Payment APIs support:

```text
Create Stripe Checkout

Confirm Payment

Get Transactions
```

Typical route patterns:

```text
POST  /api/payments/checkout

POST  /api/payments/confirm

GET   /api/payments/transactions
```

---

# 📊 Statistics APIs

Vendor Revenue Overview uses statistics provided by the server.

Example:

```text
GET /api/stats/vendor
```

Returned information can include:

```text
ticketsAdded
ticketsSold
totalRevenue
monthly
```

---

# 🗄️ Database Collections

Main MongoDB collections may include:

```text
user

tickets

bookings

transactions
```

Better Auth may also maintain additional authentication-related collections.

---

# 📁 Project Structure

A simplified server structure:

```text
src/
│
├── config/
│   └── db.js
│
├── middleware/
│   └── auth.js
│
├── routes/
│   ├── users.js
│   ├── tickets.js
│   ├── bookings.js
│   ├── payments.js
│   └── stats.js
│
├── utils/
│   ├── query.js
│   └── seatPlan.js
│
├── app.js
└── server.js
```

The exact project structure may vary slightly depending on the final implementation.

---

# 🧪 Stripe Test Payment

When Stripe is in Test Mode, a common test card is:

```text
Card Number:
4242 4242 4242 4242

Expiry:
Any future date

CVC:
123
```

No real money is charged in Stripe Test Mode.

---

# 🔗 Repository Links

**Server Repository:**  
YOUR_SERVER_GITHUB_REPOSITORY

**Client Repository:**  
YOUR_CLIENT_GITHUB_REPOSITORY

---

# 🔑 Demo Credentials

## Admin

```text
Email: YOUR_ADMIN_EMAIL
Password: YOUR_ADMIN_PASSWORD
```

## Vendor

```text
Email: YOUR_VENDOR_EMAIL
Password: YOUR_VENDOR_PASSWORD
```

These are demo application credentials only.

Never include MongoDB passwords, Stripe secret keys, Better Auth secrets, or Google secrets in the README.

---

# ✅ Major Backend Functionalities

```text
✅ Express API

✅ MongoDB Integration

✅ Authentication Verification

✅ Role-Based Authorization

✅ User Synchronization

✅ User Profile Management

✅ User Role Management

✅ Ticket CRUD

✅ Ticket Approval / Rejection

✅ Transport-Specific Seat Planning

✅ Bus HD / LD / DD

✅ Plane Seat Layout

✅ Train Coach Layout

✅ Cruise Cabin Layout

✅ Automatic Ticket Quantity

✅ Seat Availability

✅ Seat Conflict Protection

✅ Booking System

✅ Vendor Accept / Reject

✅ Pending Booking Cancellation

✅ Automatic Seat Release

✅ Stripe BDT Payment

✅ Payment Confirmation

✅ Transaction Management

✅ Vendor Revenue Analytics

✅ Fraud Vendor Protection

✅ Advertisement Management

✅ Maximum Advertisement Limit
```

---

# 🚀 Production Deployment Checklist

Before final submission, verify:

```text
✅ Server deploys successfully

✅ MongoDB production connection works

✅ Client URL is allowed by CORS

✅ No CORS errors

✅ No valid API 404 errors

✅ No 504 errors

✅ Authentication works in production

✅ JWT/JWKS verification works

✅ User role authorization works

✅ Vendor APIs work

✅ Admin APIs work

✅ Ticket approval works

✅ Seat reservation works

✅ Booking workflow works

✅ Stripe payment works

✅ BDT currency works

✅ Transaction confirmation works

✅ Revenue statistics work

✅ Fraud Vendor protection works

✅ Advertisement limit works

✅ Environment variables are configured
```

---

# 🔒 Important Security Notes

Never commit:

```text
.env

MongoDB Password

MongoDB Connection String with Credentials

BETTER_AUTH_SECRET

Google Client Secret

Stripe Secret Key

Stripe Webhook Secret
```

Make sure `.gitignore` contains:

```gitignore
node_modules
.env
.env.local
```

---

# 👨‍💻 Project Information

**Project Name:** Let'sTravel

**Project Type:** Online Ticket Booking Platform

**Backend:** Express.js + Node.js

**Database:** MongoDB

**Language:** JavaScript

**Authentication:** Better Auth compatible JWT/JWKS verification

**Payment:** Stripe

**Currency:** Bangladeshi Taka (BDT)

---

# ⭐ What Makes the Let'sTravel Backend Different?

The Let'sTravel backend is not only a simple CRUD server.

It combines:

```text
Authentication
+
Role-Based Authorization
+
User Management
+
Ticket Moderation
+
Transport-Specific Seat Generation
+
Live Seat Availability
+
Seat Conflict Protection
+
Booking State Management
+
Vendor Approval
+
Stripe BDT Payment
+
Transaction Management
+
Revenue Analytics
+
Advertisement Control
+
Fraud Vendor Protection
```

into one complete travel ticket booking backend.

---

# 🚀 Before Submission

Replace the following placeholders with your actual project information:

```text
YOUR_SERVER_LIVE_URL

YOUR_CLIENT_LIVE_URL

YOUR_SERVER_GITHUB_REPOSITORY

YOUR_CLIENT_GITHUB_REPOSITORY

YOUR_SERVER_PROJECT_FOLDER

YOUR_DATABASE_NAME

YOUR_ADMIN_EMAIL

YOUR_ADMIN_PASSWORD

YOUR_VENDOR_EMAIL

YOUR_VENDOR_PASSWORD
```

Do not put real secret keys inside this README.

---

# 📌 Required README Information Covered

This README includes:

```text
✅ Project Name
✅ Project Purpose
✅ Live URL
✅ Key Features
✅ NPM Packages Used
✅ Technologies Used
✅ Installation Guide
✅ Environment Variable Guide
✅ Main API Information
✅ Role Permissions
✅ Booking Workflow
✅ Payment Information
✅ Unique Backend Features
✅ Security Notes
✅ Repository Links
✅ Demo Credentials
```

---

## 👨‍💻 Author

Developed for the **Online Ticket Booking Platform** project.

**Project Name:** Let'sTravel