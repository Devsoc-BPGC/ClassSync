import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface ClassSession {
  day: string;
  start_time: string;
  end_time: string;
  course_code: string;
  course_name: string;
  class_type: string;
  location: string;
  instructor: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { classes } = await request.json() as { classes: ClassSession[] };

    if (!classes || !Array.isArray(classes)) {
      return NextResponse.json({ error: 'Invalid classes data' }, { status: 400 });
    }

    // Create Google Calendar API client
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: session.accessToken as string,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get current date to calculate next occurrence of each day
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay() + 1); // Monday

    const dayMap: { [key: string]: number } = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
    };

    const addedEvents = [];

    for (const classSession of classes) {
      try {
        // Calculate the next occurrence of this day
        const dayOfWeek = dayMap[classSession.day];
        if (!dayOfWeek) continue;

        const nextOccurrence = new Date(currentWeekStart);
        nextOccurrence.setDate(currentWeekStart.getDate() + (dayOfWeek - 1));

        // Parse time strings (assuming format like "9:00AM" or "14:30")
        const parseTime = (timeStr: string) => {
          const time = timeStr.toLowerCase();
          let hours = 0;
          let minutes = 0;

          if (time.includes('am') || time.includes('pm')) {
            const [timePart, period] = time.split(/(am|pm)/);
            const [h, m] = timePart.split(':').map(Number);
            hours = h;
            if (period === 'pm' && hours !== 12) hours += 12;
            if (period === 'am' && hours === 12) hours = 0;
            minutes = m || 0;
          } else {
            const [h, m] = time.split(':').map(Number);
            hours = h;
            minutes = m || 0;
          }

          return { hours, minutes };
        };

        const startTime = parseTime(classSession.start_time);
        const endTime = parseTime(classSession.end_time);

        const eventStart = new Date(nextOccurrence);
        eventStart.setHours(startTime.hours, startTime.minutes, 0, 0);

        const eventEnd = new Date(nextOccurrence);
        eventEnd.setHours(endTime.hours, endTime.minutes, 0, 0);

        const event = {
          summary: `${classSession.course_code} - ${classSession.course_name}`,
          description: `Class Type: ${classSession.class_type}\nInstructor: ${classSession.instructor}`,
          location: classSession.location,
          start: {
            dateTime: eventStart.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: eventEnd.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          recurrence: [
            'RRULE:FREQ=WEEKLY;COUNT=15', // 15 weeks (typical semester)
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
        // Continue with other events even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${addedEvents.length} events to Google Calendar`,
      events: addedEvents,
    });

  } catch (error) {
    console.error('Error adding events to calendar:', error);
    return NextResponse.json(
      { error: 'Failed to add events to calendar' },
      { status: 500 }
    );
  }
}

function getColorId(classType: string): string {
  const type = classType.toLowerCase();
  if (type.includes('lecture')) return '1'; // Blue
  if (type.includes('tutorial')) return '2'; // Green
  if (type.includes('lab') || type.includes('laboratory')) return '3'; // Purple
  return '4'; // Orange (default)
} 