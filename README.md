# Alitours Backend

This is the backend for the Alitours travel agency application, built with Node.js, Express, and PostgreSQL (via Prisma).

## Tech Stack
- **Node.js + Express**: Core API server
- **PostgreSQL + Prisma**: Database and ORM
- **Razorpay**: Payment gateway integration
- **AWS S3 / Cloudflare R2**: File storage for PDFs
- **PDFKit**: dynamic PDF generation for quotations and receipts
- **Resend**: Email delivery

## Setup Instructions

1. **Install Dependencies**
   If you haven't already:
   ```bash
   npm install
   ```

2. **Database Setup**
   Ensure you have a PostgreSQL database running. Update the `DATABASE_URL` string in the `.env` file with your credentials.

3. **Environment Variables**
   Rename `.env` and fill all configuration keys:
   - `DATABASE_URL`: Your Postgres connection string.
   - `JWT_SECRET`: A secure string for auth token generation.
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: From Razorpay dashboard.
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, etc.: S3 or R2 credentials for file storage.
   - `RESEND_API_KEY`: API key for email dispatch.

4. **Initialize Database Map**
   Push the schema to your fresh database:
   ```bash
   npx prisma db push
   # or
   npx prisma migrate dev --name init
   ```

5. **Run the Server**
   ```bash
   npm run dev
   ```
   The backend will start at `http://localhost:5000`.

## Key Features Implemented:
- JWT Admin Authentication
- Client Management CRUD operations
- Quotation to PDF generation, S3 upload, and Email link capabilities
- Razorpay Payment Link Generation
- Razorpay Webhook Event `payment_link.paid` handling (verifying payments, auto-generating receipts, creating bookings)
