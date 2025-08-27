# Database Schema Files

This directory contains the complete database schema for the Enterprise Educational Platform, organized into logical chunks for better maintainability and deployment flexibility.

## 📁 File Structure

```
database/
├── 01_core_tables.sql          # Organizations, Users, Courses, Authentication
├── 02_exam_system.sql          # Questions, Exams, Submissions, Grading
├── 03_supporting_systems.sql   # Notifications, Analytics, Security, Gamification
├── 04_triggers_functions.sql   # Database logic, triggers, views, functions
└── README.md                   # This file
```

## 🚀 Deployment Order

**IMPORTANT:** These files must be run in the exact order listed:

### 1. Core Tables First
```bash
psql -d your_database -f 01_core_tables.sql
```
**Contains:**
- Organizations (multi-tenancy)
- Users and authentication
- Media files management
- Course system
- Enrollment tracking

### 2. Exam System Second
```bash
psql -d your_database -f 02_exam_system.sql
```
**Contains:**
- Question banks and questions
- MCQ, Coding, Essay, File upload questions
- Exam creation and management
- Submissions and attempts
- Proctoring system

### 3. Supporting Systems Third
```bash
psql -d your_database -f 03_supporting_systems.sql
```
**Contains:**
- Notifications and announcements
- Analytics and reporting
- Audit logs and security
- Certificates and badges
- System settings

### 4. Triggers & Functions Last
```bash
psql -d your_database -f 04_triggers_functions.sql
```
**Contains:**
- Automated triggers
- Business logic functions
- Helpful views
- Data validation
- Utility functions

## 🔄 Complete Deployment

### Single Command Deployment
```bash
# Run all files in sequence
psql -d your_database -f 01_core_tables.sql && \
psql -d your_database -f 02_exam_system.sql && \
psql -d your_database -f 03_supporting_systems.sql && \
psql -d your_database -f 04_triggers_functions.sql
```

### Docker/Script Deployment
```bash
#!/bin/bash
DB_NAME="your_database"
DB_FILES=("01_core_tables.sql" "02_exam_system.sql" "03_supporting_systems.sql" "04_triggers_functions.sql")

for file in "${DB_FILES[@]}"; do
    echo "Running $file..."
    psql -d $DB_NAME -f "database/$file"
    if [ $? -ne 0 ]; then
        echo "Error running $file"
        exit 1
    fi
done

echo "Database schema deployment completed!"
```

## 📊 What Each File Creates

### 01_core_tables.sql
- **Tables:** 15+ core tables
- **Indexes:** 20+ performance indexes
- **Sample Data:** Default organization and admin user
- **Dependencies:** None (run first)

### 02_exam_system.sql
- **Tables:** 15+ exam-related tables
- **Indexes:** 15+ exam system indexes
- **Dependencies:** Requires 01_core_tables.sql

### 03_supporting_systems.sql
- **Tables:** 10+ supporting tables
- **Indexes:** 10+ supporting indexes
- **Dependencies:** Requires 01_core_tables.sql

### 04_triggers_functions.sql
- **Triggers:** 20+ automated triggers
- **Functions:** 10+ utility functions
- **Views:** 5+ helpful views
- **Constraints:** Data validation rules
- **Dependencies:** Requires all previous files

## 🔧 Benefits of This Approach

### ✅ **Advantages**

1. **Modular Deployment**
   - Deploy only what you need
   - Easy to troubleshoot issues
   - Clear separation of concerns

2. **Development Flexibility**
   - Work on different systems independently
   - Easy to add new features to specific areas
   - Better team collaboration

3. **Maintenance**
   - Easy to update specific systems
   - Clear file organization
   - Better version control

4. **Deployment Control**
   - Gradual rollouts possible
   - Easy rollback of specific changes
   - Environment-specific deployments

### ❌ **No Problems**

- **Foreign Key Dependencies:** Properly handled with correct order
- **Data Integrity:** All constraints maintained
- **Performance:** Same indexes as monolithic approach
- **Functionality:** Identical to single-file schema

## 🛠️ Usage Examples

### Development Environment
```bash
# Quick setup for local development
make db-setup

# Or manually
docker-compose exec db psql -U postgres -d coding_platform -f /schema/01_core_tables.sql
docker-compose exec db psql -U postgres -d coding_platform -f /schema/02_exam_system.sql
docker-compose exec db psql -U postgres -d coding_platform -f /schema/03_supporting_systems.sql
docker-compose exec db psql -U postgres -d coding_platform -f /schema/04_triggers_functions.sql
```

### Production Deployment
```bash
# Using environment variables
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Deploy with verification
./deploy-schema.sh --verify --backup
```

### Partial Updates
```bash
# Only update exam system
psql -d your_database -f 02_exam_system.sql

# Only update triggers (safe to re-run)
psql -d your_database -f 04_triggers_functions.sql
```

## 📝 Notes

- **Safe to Re-run:** All files use `CREATE ... IF NOT EXISTS` and `ON CONFLICT` clauses
- **No RLS:** Schema designed for application-level security
- **Production Ready:** Includes all enterprise features
- **Fully Connected:** All foreign keys and relationships maintained
- **Sample Data Included:** Default organization and admin user for quick start

## 🔍 Verification

After deployment, you can verify the schema:

```sql
-- Check table count
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Check indexes
SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';

-- Check triggers
SELECT COUNT(*) FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Verify sample data
SELECT * FROM organizations WHERE slug = 'default';
SELECT * FROM users WHERE role = 'super_admin';
```

This chunked approach gives you maximum flexibility while maintaining all the benefits of the complete schema!
