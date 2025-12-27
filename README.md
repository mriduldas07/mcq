# MCQ Exam Platform Micro-SaaS

This is a comprehensive MVP for an online MCQ Exam Platform designed for teachers to create, monetize, and conduct exams with ease.

## Features

- **Teacher Dashboard**: Create, Edit, Publish exams.
- **Monetization**:
  - **Subscriptions**: Unlimited exams for Pro users.
  - **Pay-Per-Exam**: Credit system for free users.
- **Exam Engine**:
  - Rich text questions.
  - Timer system with auto-submit.
  - **Anti-Cheat**: Tab-switch and focus loss detection.
- **Student Experience**:
  - Distraction-free exam interface.
  - Mobile-responsive.
  - Instant results.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Database Setup**:
    - Ensure PostgreSQL is running.
    - Update `.env` with your `DATABASE_URL`.
    - Run migrations:
      ```bash
      npx prisma migrate dev --name init
      ```
    - (Optional) Seed the database:
      ```bash
      npx prisma db seed
      ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## Credential Mocking (For Demo)
If you do not have a live database connection, the system is configured to fallback to **Mock Data** for critical flows:
- **Login**: Any credential works (redirects to dashboard).
- **Exam Creation**: Will simulate creation if DB fails.
- **Publishing**: Will simulate publishing and credit deduction.

## Project Structure
- `src/app/(dashboard)`: Protected teacher routes.
- `src/app/(public)`: Public access routes (Exam taking).
- `src/actions`: Server actions for business logic.
- `src/lib/payment-service.ts`: Abstraction for monetization logic.
