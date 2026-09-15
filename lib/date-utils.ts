/**
 * Date utility functions for appointment countdowns and date formatting
 */

export interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMilliseconds: number
  isPast: boolean
  isToday: boolean
  isTomorrow: boolean
  isWithin24Hours: boolean
  isWithinWeek: boolean
}

/**
 * Calculate time remaining until a specific date
 */
export function getTimeRemaining(targetDate: Date | string): TimeRemaining {
  const now = new Date()
  const target = new Date(targetDate)
  const diff = target.getTime() - now.getTime()

  const isPast = diff < 0
  const absDiff = Math.abs(diff)

  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((absDiff % (1000 * 60)) / 1000)

  const isToday = isSameDay(now, target)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = isSameDay(tomorrow, target)

  const isWithin24Hours = absDiff < 24 * 60 * 60 * 1000
  const isWithinWeek = absDiff < 7 * 24 * 60 * 60 * 1000

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMilliseconds: diff,
    isPast,
    isToday,
    isTomorrow,
    isWithin24Hours,
    isWithinWeek,
  }
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Format countdown as human-readable string
 */
export function formatCountdown(timeRemaining: TimeRemaining): string {
  if (timeRemaining.isPast) {
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days} day${timeRemaining.days > 1 ? "s" : ""} ago`
    } else if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours} hour${timeRemaining.hours > 1 ? "s" : ""} ago`
    } else if (timeRemaining.minutes > 0) {
      return `${timeRemaining.minutes} minute${timeRemaining.minutes > 1 ? "s" : ""} ago`
    } else {
      return "Just now"
    }
  }

  if (timeRemaining.isToday) {
    if (timeRemaining.hours > 0) {
      return `Today in ${timeRemaining.hours}h ${timeRemaining.minutes}m`
    } else if (timeRemaining.minutes > 0) {
      return `Today in ${timeRemaining.minutes} minute${timeRemaining.minutes > 1 ? "s" : ""}`
    } else {
      return "Starting now!"
    }
  }

  if (timeRemaining.isTomorrow) {
    return `Tomorrow at ${timeRemaining.hours}h ${timeRemaining.minutes}m`
  }

  if (timeRemaining.days > 0) {
    if (timeRemaining.days === 1) {
      return `1 day, ${timeRemaining.hours}h`
    }
    return `${timeRemaining.days} days, ${timeRemaining.hours}h`
  }

  return `${timeRemaining.hours}h ${timeRemaining.minutes}m`
}

/**
 * Format countdown as short version (for compact displays)
 */
export function formatCountdownShort(timeRemaining: TimeRemaining): string {
  if (timeRemaining.isPast) return "Past"

  if (timeRemaining.isToday) {
    if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m`
    }
    return `${timeRemaining.minutes}m`
  }

  if (timeRemaining.isTomorrow) return "Tomorrow"

  if (timeRemaining.days > 7) {
    const weeks = Math.floor(timeRemaining.days / 7)
    return `${weeks}w`
  }

  if (timeRemaining.days > 0) {
    return `${timeRemaining.days}d`
  }

  return `${timeRemaining.hours}h`
}

/**
 * Get urgency level based on time remaining
 */
export function getUrgencyLevel(
  timeRemaining: TimeRemaining
): "critical" | "high" | "medium" | "low" | "past" {
  if (timeRemaining.isPast) return "past"
  if (timeRemaining.hours < 1) return "critical"
  if (timeRemaining.isToday || timeRemaining.isWithin24Hours) return "high"
  if (timeRemaining.days < 3) return "medium"
  return "low"
}

/**
 * Format date for display
 */
export function formatAppointmentDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Format time for display
 */
export function formatAppointmentTime(time: string): string {
  // Handle various time formats
  if (!time) return ""

  // If already in 12-hour format, return as is
  if (time.toLowerCase().includes("am") || time.toLowerCase().includes("pm")) {
    return time
  }

  // Try to parse 24-hour format
  const match = time.match(/^(\d{1,2}):(\d{2})/)
  if (match) {
    let hours = parseInt(match[1], 10)
    const minutes = match[2]
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12 || 12
    return `${hours}:${minutes} ${ampm}`
  }

  return time
}

/**
 * Combine date and time into a single Date object
 */
export function combineDateTime(date: Date | string, time: string): Date {
  const d = new Date(date)

  // Parse time string
  const timeMatch = time.match(/^(\d{1,2}):(\d{2})/)
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10)
    const minutes = parseInt(timeMatch[2], 10)

    // Check if time includes AM/PM
    if (time.toLowerCase().includes("pm") && hours < 12) {
      hours += 12
    } else if (time.toLowerCase().includes("am") && hours === 12) {
      hours = 0
    }

    d.setHours(hours, minutes, 0, 0)
  }

  return d
}
