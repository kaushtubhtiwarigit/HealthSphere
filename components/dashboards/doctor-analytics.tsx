"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DoctorAnalytics } from "@/lib/types"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, TrendingDown, Minus, Users, Calendar, FileText, Pill, Clock, Star } from "lucide-react"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

interface DoctorAnalyticsProps {
  analytics: DoctorAnalytics | null
  loading?: boolean
}

export function DoctorAnalyticsComponent({ analytics, loading }: DoctorAnalyticsProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    )
  }

  const { patientStats, demographics, appointmentAnalytics, medicalInsights, performanceMetrics, trends } = analytics

  const renderTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  // Prepare data for charts
  const genderData = Object.entries(demographics.gender).map(([name, value]) => ({ name, value }))
  const ageData = Object.entries(demographics.ageGroups).map(([name, value]) => ({ name, value }))

  const hourlyData = appointmentAnalytics.hourlyDistribution
    .map((count, hour) => ({ hour: `${hour}:00`, appointments: count }))
    .filter((d) => d.appointments > 0)

  const dailyData = Object.entries(appointmentAnalytics.dailyDistribution).map(([day, count]) => ({
    day,
    appointments: count,
  }))

  const diagnosesData = medicalInsights.topDiagnoses.slice(0, 5)
  const medicationsData = medicalInsights.topMedications.slice(0, 5)

  const seasonalTrendsData = medicalInsights.seasonalTrends.map((trend) => ({
    month: trend.month,
    diagnoses: trend.totalDiagnoses,
  }))

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientStats.totalPatients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {patientStats.newPatientsMonth} new this month
            </p>
          </CardContent>
        </Card>

        {/* Appointments This Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Appointments (Month)</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.totalAppointmentsMonth}</div>
            <div className="flex items-center gap-2 mt-1">
              {trends.appointments && renderTrendIcon(trends.appointments.trend)}
              <p className="text-xs text-muted-foreground">
                {trends.appointments?.percentage || 0}% vs last month
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Medical Records */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Records Created</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medicalInsights.totalRecords}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {performanceMetrics.totalRecordsMonth} this month
            </p>
          </CardContent>
        </Card>

        {/* Prescriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prescriptions</CardTitle>
            <Pill className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medicalInsights.totalPrescriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {performanceMetrics.totalPrescriptionsMonth} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.consultationsPerDay}</div>
            <p className="text-xs text-muted-foreground mt-1">Average per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentAnalytics.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {appointmentAnalytics.completed} of {appointmentAnalytics.total} appointments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.averageResponseTime}</div>
            <p className="text-xs text-muted-foreground mt-1">To patient queries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Patient Satisfaction</CardTitle>
            <Star className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.patientSatisfaction}/5.0</div>
            <p className="text-xs text-muted-foreground mt-1">Average rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Patient Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
            <CardDescription>Patient demographics by gender</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
            <CardDescription>Patient demographics by age group</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Distribution by Hour</CardTitle>
            <CardDescription>Peak hours: {appointmentAnalytics.peakHour}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak Days */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Distribution by Day</CardTitle>
            <CardDescription>Peak day: {appointmentAnalytics.peakDay}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Status Overview</CardTitle>
          <CardDescription>Current month statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Completed</p>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{appointmentAnalytics.completed}</div>
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                  {appointmentAnalytics.completionRate}%
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <div className="text-2xl font-bold">{appointmentAnalytics.scheduled}</div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Cancelled</p>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{appointmentAnalytics.cancelled}</div>
                <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
                  {appointmentAnalytics.cancellationRate}%
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">No-Show Rate</p>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{appointmentAnalytics.noShowRate}%</div>
              </div>
            </div>
          </div>

          {/* Cancellation Reasons */}
          {Object.keys(appointmentAnalytics.cancellationReasons).length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">Cancellation Reasons</h4>
              <div className="space-y-2">
                {Object.entries(appointmentAnalytics.cancellationReasons)
                  .slice(0, 5)
                  .map(([reason, count]) => (
                    <div key={reason} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{reason}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Diagnoses */}
        <Card>
          <CardHeader>
            <CardTitle>Most Common Diagnoses</CardTitle>
            <CardDescription>Top 5 diagnoses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={diagnosesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="diagnosis" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Medications */}
        <Card>
          <CardHeader>
            <CardTitle>Most Prescribed Medications</CardTitle>
            <CardDescription>Top 5 medications</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={medicationsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="medication" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="count" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Seasonal Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Diagnosis Trends (Last 6 Months)</CardTitle>
          <CardDescription>Monthly diagnosis patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={seasonalTrendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="diagnoses" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>

          {/* Show top diagnosis per month */}
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Top Diagnosis by Month</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {medicalInsights.seasonalTrends.map((trend) => (
                <div key={trend.month} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{trend.month}</p>
                  <p className="text-sm font-medium">{trend.topDiagnosis}</p>
                  <Badge variant="outline" className="text-xs">
                    {trend.totalDiagnoses} cases
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Flow</CardTitle>
          <CardDescription>New vs returning patients this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Patients Seen</p>
              <div className="text-3xl font-bold">{patientStats.monthly}</div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">New Patients</p>
              <div className="text-3xl font-bold text-blue-600">{patientStats.newPatientsMonth}</div>
              <p className="text-xs text-muted-foreground">
                {patientStats.monthly > 0
                  ? ((patientStats.newPatientsMonth / patientStats.monthly) * 100).toFixed(1)
                  : 0}
                % of total
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Returning Patients</p>
              <div className="text-3xl font-bold text-green-600">{patientStats.returningPatientsMonth}</div>
              <p className="text-xs text-muted-foreground">
                {patientStats.monthly > 0
                  ? ((patientStats.returningPatientsMonth / patientStats.monthly) * 100).toFixed(1)
                  : 0}
                % of total
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">This week</span>
              <span className="font-medium">{patientStats.weekly} patients</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Today</span>
              <span className="font-medium">{patientStats.daily} patients</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
