export type UserRole = "patient" | "doctor" | "admin"

export interface User {
  _id?: string
  id?: string // client-side id used by legacy UI
  email: string
  password?: string
  // UI currently uses a single name field
  name?: string
  fullName?: string
  // For APIs we also support first/last
  firstName?: string
  lastName?: string
  role: UserRole
  phone?: string
  createdAt?: Date | string
  updatedAt?: Date | string
  availableSlots?: TimeSlot[]
}

export interface MedicalFileInfo {
  // AI-extracted summary of the file contents
  summary: string
  // Arbitrary structured details extracted by AI
  details: any
  // When the file was uploaded
  uploadedAt: Date | string
  // Cloud storage metadata (optional for backward compatibility)
  url?: string // secure URL to the uploaded asset
  publicId?: string // Cloudinary public_id
  thumbnailUrl?: string // optional thumbnail/preview URL
  mimeType?: string
  bytes?: number
  format?: string // e.g., jpg, png, pdf, docx
  width?: number
  height?: number
  pageCount?: number
  originalFileName?: string
  // Basic categorization to help filtering in UI
  category?: "lab_result" | "prescription" | "imaging" | "insurance" | "referral" | "other"
}

export interface PatientProfile extends User {
  role: "patient"
  dateOfBirth?: Date
  gender?: string
  address?: string
  emergencyContact?: string
  bloodGroup?: string
  medicalHistory?: string[]
  allergies?: string[]
  medicalFilesInformation?: MedicalFileInfo[]
}

export interface DoctorProfile extends User {
  role: "doctor"
  specialization: string
  licenseNumber: string
  yearsOfExperience: number
  hospitalAffiliation?: string
  consultationFee?: number
  availableSlots?: TimeSlot[]
}

export interface TimeSlot {
  day: string
  startTime: string
  endTime: string
}

export interface MedicalRecord {
  _id?: string
  id?: string
  patientId: string
  doctorId: string
  date: Date
  diagnosis: string
  symptoms: string[]
  notes?: string
  attachments?: string[]
}

export interface Appointment {
  _id?: string
  id?: string
  patientId: string
  doctorId: string
  date: Date
  time: string
  status: "scheduled" | "completed" | "cancelled"
  reason?: string
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Prescription {
  _id?: string
  id?: string
  recordId: string
  patientId: string
  doctorId: string
  medications: Medication[]
  notes?: string
  issuedDate: Date
  expiryDate: Date
  createdAt?: Date
}

export interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  token?: string
  user?: User
}

// Medication interaction and duplicate therapy types
export interface MedicationInteraction {
  id: string
  medication1: string
  medication2: string
  severity: "minor" | "moderate" | "major" | "critical"
  description: string
  recommendation: string
}

export interface DuplicateTherapy {
  id: string
  medications: string[]
  therapeuticClass: string
  description: string
  recommendation: string
}

export interface MedicationCheckResult {
  interactions: MedicationInteraction[]
  duplicates: DuplicateTherapy[]
  overallRisk: "low" | "moderate" | "high" | "critical"
  contactProvider: boolean
  summary: string
}

// Appointment preparation types
export interface PrepChecklistItem {
  id: string
  text: string
  completed: boolean
  category: "documents" | "symptoms" | "questions" | "lifestyle" | "medications"
}

export interface AppointmentPrepPack {
  appointmentId: string
  appointmentReason: string
  appointmentDate: Date
  checklist: PrepChecklistItem[]
  questionsToAsk: string[]
  thingsToMention: string[]
  documentsNeeded: string[]
  summary: string
}

// Analytics types
export interface PatientStats {
  daily: number
  weekly: number
  monthly: number
  newPatientsMonth: number
  returningPatientsMonth: number
  totalPatients: number
}

export interface Demographics {
  gender: Record<string, number>
  ageGroups: Record<string, number>
}

export interface AppointmentAnalytics {
  total: number
  scheduled: number
  completed: number
  cancelled: number
  completionRate: number
  cancellationRate: number
  noShowRate: number
  averageDuration: number
  peakHour: string
  peakDay: string
  hourlyDistribution: number[]
  dailyDistribution: Record<string, number>
  cancellationReasons: Record<string, number>
}

export interface MedicalInsights {
  topDiagnoses: Array<{ diagnosis: string; count: number }>
  topMedications: Array<{ medication: string; count: number }>
  topSymptoms: Array<{ symptom: string; count: number }>
  seasonalTrends: Array<{ month: string; totalDiagnoses: number; topDiagnosis: string }>
  totalRecords: number
  totalPrescriptions: number
}

export interface PerformanceMetrics {
  consultationsPerDay: number
  recordsPerAppointment: number
  prescriptionsPerAppointment: number
  averageResponseTime: string
  patientSatisfaction: number
  totalAppointmentsMonth: number
  totalRecordsMonth: number
  totalPrescriptionsMonth: number
}

export interface TrendData {
  value: number
  trend: "up" | "down" | "stable"
  percentage: number
}

export interface DoctorAnalytics {
  patientStats: PatientStats
  demographics: Demographics
  appointmentAnalytics: AppointmentAnalytics
  medicalInsights: MedicalInsights
  performanceMetrics: PerformanceMetrics
  trends: Record<string, TrendData>
  metadata: {
    doctorId: string
    generatedAt: string
    dataRange: {
      from: string
      to: string
    }
    totalDataPoints: {
      patients: number
      appointments: number
      records: number
      prescriptions: number
    }
  }
}

// AI Clinical Tools types
export interface DifferentialDiagnosis {
  condition: string
  probability: "High" | "Moderate" | "Low"
  severity: "Critical" | "Severe" | "Moderate" | "Mild"
  reasoning: string
  recommendedTests: string[]
}

export interface DifferentialDiagnosisResult {
  differentialDiagnoses: DifferentialDiagnosis[]
  urgencyLevel: "Emergency" | "Urgent" | "Routine"
  redFlags: string[]
  recommendedActions: string[]
}

export interface DrugInteraction {
  medications: string[]
  severity: "Critical" | "Major" | "Moderate" | "Minor"
  description: string
  recommendation: string
  alternatives: string[]
}

export interface DrugInteractionResult {
  hasInteractions: boolean
  interactions: DrugInteraction[]
  dosageWarnings: string[]
  patientSpecificWarnings: string[]
  overallRisk: "Critical" | "High" | "Moderate" | "Low"
}

export interface LiteratureResult {
  title: string
  source: string
  summary: string
  relevance: "High" | "Moderate" | "Low"
  year: number
  keyPoints?: string[]
  url?: string
}

export interface MedicalLiteratureSearch {
  results: LiteratureResult[]
  searchQuery: string
  totalResults: number
}

export interface ImageAnalysisFinding {
  finding: string
  severity: "Critical" | "Significant" | "Mild" | "Normal"
  location: string
  confidence: "High" | "Moderate" | "Low"
}

export interface MedicalImageAnalysis {
  findings: ImageAnalysisFinding[]
  impression: string
  recommendations: string[]
  disclaimer: string
  imageUrl?: string
  analyzedAt?: Date
}

export interface ClinicalNotesProcessing {
  formattedNotes: string
  extractedEntities: {
    symptoms: string[]
    diagnoses: string[]
    medications: string[]
    procedures: string[]
    labs: string[]
  }
  suggestedDiagnosis: string
  suggestedActions: string[]
}

export interface DosageCalculation {
  standardDosage: string
  adjustedDosage: string
  frequency: string
  route?: string
  duration?: string
  warnings: string[]
  monitoring: string[]
  disclaimer?: string
}

