# Database Schema Documentation

This directory contains the database schema for the Coding Enterprise Platform.

## Complete Schema

The file `complete_schema.sql` is a consolidated script that sets up the entire database structure. It includes:

1.  **Core Tables**: Organizations, Users, Authentication, Media Files.
2.  **Course System**: Courses, Sections, Enrollments, Progress.
3.  **Exam System**: Question Banks, Questions (MCQ, Coding, etc.), Exams, Submissions, Proctoring.
4.  **Supporting Systems**: Notifications, Analytics, Audit Logs, Gamification (Badges/Certificates).
5.  **Security & Monitoring**: Exam monitoring logs, violations, security metrics.
6.  **Performance Indexes**: Optimized indexes for common queries.
7.  **Storage Policies**: Access control for file storage.
8.  **Seed Data**: Default organization and admin user.

## How to Use

### 1. Prerequisites

-   A PostgreSQL database (Supabase recommended).
-   `uuid-ossp`, `pgcrypto`, and `pg_trgm` extensions enabled (the script attempts to enable them).

### 2. Storage Setup (Supabase)

Before running the schema, or immediately after, you must create the storage bucket in your Supabase dashboard:

1.  Go to **Storage** in the Supabase Dashboard.
2.  Click **Create bucket**.
3.  Name the bucket: `organization-logos`.
4.  **Important**: Toggle "Public bucket" to **ON**.
5.  Set file size limit (e.g., 2MB) and allowed MIME types (`image/*`).
6.  Click **Create bucket**.

The `complete_schema.sql` script includes policies to secure this bucket, but the bucket itself must be created manually or via the Supabase API/CLI.

### 3. Running the Schema

You can run the `complete_schema.sql` file in the SQL Editor of your Supabase dashboard or using a PostgreSQL client (like psql, DBeaver, or TablePlus).

**Using Supabase Dashboard:**
1.  Open the SQL Editor.
2.  Copy the contents of `complete_schema.sql`.
3.  Paste into the editor and click **Run**.

**Using psql:**
```bash
psql -h your-db-host -U your-db-user -d your-db-name -f apps/web/database_schema/complete_schema.sql
```

### 4. Default Credentials

The script creates a default organization and a super admin user:

-   **Organization**: Default Organization (slug: `default`)
-   **User Email**: `admin@system.local`
-   **User ID**: `00000000-0000-0000-0000-000000000001`

*Note: You will need to manually set a password for this user in the `auth.users` table if using Supabase Auth, or use the "Forgot Password" flow if email is configured.*

## Schema Structure

### Core Systems
-   `organizations`: Multi-tenant root table.
-   `users`: User profiles linked to organizations.
-   `courses`: Educational content structure.

### Exam System
-   `questions`: Polymorphic table for different question types (MCQ, Coding, etc.).
-   `exams`: Configuration for assessments.
-   `exam_submissions`: Student attempts and grading.
-   `exam_monitoring_logs`: Security events during exams (tab switching, etc.).

### Security Features
-   **Row Level Security (RLS)**: (Note: RLS policies are not fully defined in this schema script and should be added based on specific application needs, though the table structure supports ownership tracking).
-   **Audit Logs**: Tracks critical system actions.
-   **Exam Proctoring**: Logs suspicious activities during exams.

## Migration Notes

If you are migrating from an older version, check the individual numbered files (`01_...`, `02_...`) for incremental changes. The `complete_schema.sql` represents the latest state.
