# HealthFlow - AI-Powered Healthcare Management Portal

A comprehensive healthcare management system built with Next.js, featuring role-based access control for patients, doctors, and administrators.

## Features

### Patient Portal
- Medical records management with diagnosis tracking
- Prescription management and medication tracking
- Appointment scheduling and history
- View and upload medical documents

### Doctor Dashboard
- Patient list management
- Medical record creation and management
- **AI-powered prescription suggestions (Gemini AI)**
- **📊 Analytics & Insights Dashboard** - Real-time statistics, trends, and visualizations
- **🧠 AI Clinical Decision Support Tools:**
  - Differential diagnosis generator
  - Drug interaction checker
  - Medical literature search
  - Medical image analysis (X-ray, CT, MRI)
  - Voice-to-text clinical notes
  - Dosage calculator
- Appointment management
- Patient history and analytics

### Admin Panel
- User management and role assignment
- System-wide appointment oversight
- User statistics and analytics
- Appointment status management

### Authentication
- Role-based access control (Patient, Doctor, Admin)
- Secure login and registration
- Session management with MongoDB
- Demo credentials for testing

## Demo Credentials

### Patient Login
- Email: `john@example.com`
- Password: `password123`

### Doctor Login
- Email: `dr.smith@example.com`
- Password: `password123`

### Admin Login
- Email: `admin@example.com`
- Password: `password123`

## Technology Stack

- **Frontend**: Next.js 16, React 18, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **State Management**: React Context API
- **AI**: Google Gemini 1.5 Flash API
- **Database**: MongoDB
- **Charts**: Recharts 2.15.4

## Project Structure

\`\`\`
app/
├── page.tsx                 # Home page with role selection
├── login/                   # Login page
├── signup/                  # Signup page
├── dashboard/               # Main dashboards
│   ├── page.tsx            # Dashboard router
│   ├── medical-records/    # Patient medical records
│   ├── prescriptions/      # Patient prescriptions
│   ├── appointments/       # Patient appointments
│   ├── doctor/             # Doctor routes
│   │   ├── patients/       # Doctor's patient list
│   │   └── patient/[id]/   # Individual patient details
│   └── admin/              # Admin routes
│       ├── users/          # User management
│       └── appointments/   # Appointment management
components/
├── dashboards/             # Role-specific dashboards
├── protected-route.tsx     # Route protection component
└── ui/                     # shadcn/ui components
lib/
├── types.ts               # TypeScript type definitions
├── storage.ts             # localStorage management
├── auth-context.tsx       # Authentication context
└── ai-utils.ts           # AI integration utilities
\`\`\`

## Getting Started

1. **Install dependencies**:
   \`\`\`bash
   npm install
   # or
   pnpm install
   \`\`\`

2. **Setup environment variables**:
   Create a `.env.local` file with:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/healthsphere
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   Copy from example:
   ```bash
   cp .env.example .env.local
   ```

3. **Setup MongoDB**:
   - Install MongoDB locally or use MongoDB Atlas
   - Run the seed script to populate demo data:
   ```bash
   npm run seed
   ```
   This creates demo users, medical records, prescriptions, and appointments.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   - Navigate to `http://localhost:3000`
   - Select a role and login with demo credentials

## Features Overview

### Patient Experience
- Create and manage medical records
- View prescriptions with dosage information
- Schedule appointments with doctors
- Track appointment history

### Doctor Experience
- View list of assigned patients
- Create medical records for patients
- Generate AI-powered prescription suggestions
- Manage patient appointments

### Admin Experience
- View all users in the system
- Filter users by role
- Manage appointment statuses
- View system statistics

## AI Features

The system includes comprehensive AI-powered clinical tools using Google's Gemini 1.5 Flash:

### AI Prescription Suggestions
When a doctor creates a medical record, they can:
1. Generate AI-powered prescription suggestions based on diagnosis
2. Review AI recommendations
3. Customize recommendations before saving

### AI Clinical Decision Support (NEW)
- **Differential Diagnosis**: Generate ranked diagnoses from symptoms with probability scores
- **Drug Interaction Checker**: Real-time checking of medication interactions with severity levels
- **Medical Literature Search**: Search research papers, clinical trials, and guidelines
- **Medical Image Analysis**: AI analysis of X-rays, CT scans, and MRIs with findings and recommendations
- **Voice Clinical Notes**: Record and transcribe clinical notes with automatic medical entity extraction
- **Dosage Calculator**: Calculate medication dosages based on patient factors (weight, age, renal/hepatic function)

All AI tools are integrated directly into doctor workflows with real MongoDB storage (no mocking).

See [AI_CLINICAL_TOOLS_IMPLEMENTATION.md](./AI_CLINICAL_TOOLS_IMPLEMENTATION.md) for complete documentation.

### Analytics Dashboard (NEW)
- **Patient Statistics**: Total patients, new patients, demographics breakdown
- **Appointment Analytics**: Completed, pending, cancelled counts with hourly and daily patterns
- **Medical Insights**: Top diagnoses, medications, seasonal trends
- **Performance Metrics**: Average wait time, patient satisfaction, bed occupancy
- **Visualizations**: 10+ interactive charts (pie, bar, line) using Recharts
- **Export**: Export all analytics data to JSON

See [ANALYTICS_DASHBOARD_IMPLEMENTATION.md](./ANALYTICS_DASHBOARD_IMPLEMENTATION.md) for complete documentation.

## Future Enhancements

- **Security**: Implement password hashing (bcrypt) - currently using plain text for demo
- File upload for medical documents
- Email notifications for appointments
- Video consultation integration
- Insurance integration
- Mobile app
- Advanced analytics and reporting
- Export medical records to PDF

## Notes

- This application uses MongoDB for data persistence
- Demo credentials are available for testing all roles
- **⚠️ Security Warning**: Demo uses plain text passwords. For production, implement bcrypt password hashing.
- Run `npm run seed` to populate the database with demo data

## License

MIT
