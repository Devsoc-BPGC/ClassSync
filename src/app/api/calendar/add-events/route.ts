import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { getUserIp } from '@/utils/ip';

interface ClassSession {
  day: string;
  start_time: string;
  end_time: string;
  course_code: string;
  course_name: string;
  class_type: string;
  location: string;
  instructor?: string | null;
}

function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

function validateTimeFormat(timeStr: string): boolean {
  const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)?$|^(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/i;
  return timeRegex.test(timeStr);
}

function parseTime(timeStr: string): { hours: number; minutes: number; isValid: boolean } {
  if (!validateTimeFormat(timeStr)) {
    return { hours: 0, minutes: 0, isValid: false };
  }

  const time = timeStr.toLowerCase().trim();
  let hours = 0;
  let minutes = 0;

  try {
    if (time.includes('am') || time.includes('pm')) {
      const [timePart, period] = time.split(/(am|pm)/);
      const [h, m] = timePart.split(':').map(Number);
      
      if (isNaN(h) || isNaN(m) || h < 1 || h > 12 || m < 0 || m > 59) {
        return { hours: 0, minutes: 0, isValid: false };
      }
      
      hours = h;
      if (period === 'pm' && hours !== 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      minutes = m;
    } else {
      const [h, m] = time.split(':').map(Number);
      
      if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
        return { hours: 0, minutes: 0, isValid: false };
      }
      
      hours = h;
      minutes = m;
    }

    return { hours, minutes, isValid: true };
  } catch (error) {
    return { hours: 0, minutes: 0, isValid: false };
  }
}

function validateClassSession(classSession: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!classSession || typeof classSession !== 'object') {
    errors.push('Invalid class session object');
    return { isValid: false, errors };
  }

  const requiredFields = ['day', 'start_time', 'end_time', 'course_code', 'course_name', 'class_type', 'location'];
  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  requiredFields.forEach(field => {
    if (!classSession[field] || typeof classSession[field] !== 'string') {
      errors.push(`Missing or invalid ${field}`);
    }
  });

  if (classSession.day && !validDays.includes(classSession.day)) {
    errors.push(`Invalid day: ${classSession.day}`);
  }

  const startTime = parseTime(classSession.start_time);
  const endTime = parseTime(classSession.end_time);

  if (!startTime.isValid) {
    errors.push(`Invalid start time format: ${classSession.start_time}`);
  }

  if (!endTime.isValid) {
    errors.push(`Invalid end time format: ${classSession.end_time}`);
  }

  if (startTime.isValid && endTime.isValid) {
    const startMinutes = startTime.hours * 60 + startTime.minutes;
    const endMinutes = endTime.hours * 60 + endTime.minutes;
    
    if (endMinutes <= startMinutes) {
      errors.push('End time must be after start time');
    }
  }

  return { isValid: errors.length === 0, errors };
}


const rateLimiter = new RateLimiterMemory({
  points: 4, 
  duration: 60, 
});

export async function POST(request: NextRequest) {
  try {
    const ip = await getUserIp();
    await rateLimiter.consume(ip, 2);
    
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { classes } = body as { classes: ClassSession[] };

    if (!classes || !Array.isArray(classes)) {
      return NextResponse.json({ error: 'Invalid classes data' }, { status: 400 });
    }

    if (classes.length === 0) {
      return NextResponse.json({ error: 'No classes provided' }, { status: 400 });
    }

    if (classes.length > 100) {
      return NextResponse.json({ error: 'Too many classes. Maximum 100 allowed.' }, { status: 400 });
    }

    const validationErrors: string[] = [];
    classes.forEach((classSession, index) => {
      const validation = validateClassSession(classSession);
      if (!validation.isValid) {
        validation.errors.forEach(error => {
          validationErrors.push(`Class ${index + 1}: ${error}`);
        });
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Invalid class data', 
        details: validationErrors.join(', ')
      }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: session.accessToken as string,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay() + 1); 

    const dayMap: { [key: string]: number } = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
    };

    const addedEvents = [];
    const failedEvents: string[] = [];

    for (const classSession of classes) {
      try {
        const dayOfWeek = dayMap[classSession.day];
        if (!dayOfWeek) {
          failedEvents.push(`${classSession.course_code}: Invalid day`);
          continue;
        }

        const nextOccurrence = new Date(currentWeekStart);
        nextOccurrence.setDate(currentWeekStart.getDate() + (dayOfWeek - 1));

        const startTime = parseTime(classSession.start_time);
        const endTime = parseTime(classSession.end_time);

        if (!startTime.isValid || !endTime.isValid) {
          failedEvents.push(`${classSession.course_code}: Invalid time format`);
          continue;
        }

        const eventStart = new Date(nextOccurrence);
        eventStart.setHours(startTime.hours, startTime.minutes, 0, 0);
        eventStart.setTime(eventStart.getTime() - (5 * 60 + 30) * 60 * 1000);

        const eventEnd = new Date(nextOccurrence);
        eventEnd.setHours(endTime.hours, endTime.minutes, 0, 0);
        eventEnd.setTime(eventEnd.getTime() - (5 * 60 + 30) * 60 * 1000);

        const sanitizedCourseCode = sanitizeString(classSession.course_code);
        const sanitizedCourseName = sanitizeString(classSession.course_name);
        const sanitizedLocation = sanitizeString(classSession.location);
        const sanitizedInstructor = sanitizeString(classSession.instructor || '');

        const event = {
          summary: `${sanitizedCourseCode} - ${sanitizedCourseName}`,
          description: `Class Type: ${classSession.class_type}\nInstructor: ${sanitizedInstructor}`,
          location: sanitizedLocation,
          start: {
            dateTime: eventStart.toISOString(),
            timeZone: 'Asia/Kolkata',
          },
          end: {
            dateTime: eventEnd.toISOString(),
            timeZone: 'Asia/Kolkata',
          },
          recurrence: [
            'RRULE:FREQ=WEEKLY;UNTIL=20251130T235959Z',
          ],
          colorId: getColorId(classSession.class_type),
        };

        const response = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event,
        });

        addedEvents.push({
          id: response.data.id,
          summary: event.summary,
          start: event.start.dateTime,
        });

      } catch (error) {
        console.error(`Error adding event for ${classSession.course_code}:`, error);
        failedEvents.push(`${classSession.course_code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const message = failedEvents.length > 0 
      ? `Successfully added ${addedEvents.length} events. ${failedEvents.length} events failed.`
      : `Successfully added ${addedEvents.length} events to Google Calendar`;

    return NextResponse.json({
      success: true,
      message,
      events: addedEvents,
      failedEvents: failedEvents.length > 0 ? failedEvents : undefined,
    });

  } catch (error) {
    // Handle rate limiting errors
    if (error instanceof Error && error.message.includes('RateLimiter')) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    console.error('Error in calendar API:', error);
    return NextResponse.json(
      { error: 'Failed to add events to calendar' },
      { status: 500 }
    );
  }
}

function getColorId(classType: string): string {
  const type = classType.toLowerCase();
  if (type.includes('lecture')) return '1';
  if (type.includes('tutorial')) return '2';
  if (type.includes('lab') || type.includes('laboratory')) return '3';
  return '4';
} 