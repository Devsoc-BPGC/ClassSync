import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';


const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const prompt = `STEP-BY-STEP EXTRACTION METHOD:
1. Look at the image and identify the 5 day columns: Monday (leftmost), Tuesday, Wednesday, Thursday, Friday (rightmost)
2. For each day column, scan vertically from top to bottom (8:00AM to 7:00PM)
3. When you find a green box in a day column, extract its information
4. Each green box = one class session
5. Consecutive green boxes are DIFFERENT classes (even if they appear adjacent)
6. Some classes may span multiple time slots (labs), but consecutive boxes with different text are separate

CRITICAL DAY ASSIGNMENT RULES:
- ONLY extract classes from the specific day column you're currently processing
- NEVER copy a class from one day column to another day
- Each class must be assigned to the day column where it actually appears
- A course can have multiple lectures/tutorials/labs in different days of the week (this is normal)
- If you see the same course code in multiple days, this is likely correct - verify by checking the image
- The same course should NOT appear in the same time slot on multiple days (this would be an error)

EXTRACTION ORDER:
1. Process Monday column (leftmost) - extract ALL green boxes in this column only
2. Process Tuesday column - extract ALL green boxes in this column only  
3. Process Wednesday column - extract ALL green boxes in this column only
4. Process Thursday column - extract ALL green boxes in this column only
5. Process Friday column (rightmost) - extract ALL green boxes in this column only

For each class session, extract:
- day (Monday, Tuesday, Wednesday, Thursday, Friday)
- start_time (in 12-hour format like "9:00AM", "2:00PM")
- end_time (in 12-hour format like "9:50AM", "2:50PM")
- course_code (e.g., "CS F213", "ECE F241")
- course_name (full course name)
- class_type (Lecture, Tutorial, Laboratory/Lab)
- location (room/venue)
- instructor (name or "Staff" if not specified)

FINAL CHECK:
- Verify each class is in the correct day column
- Ensure no class appears in multiple days unless actually scheduled that way
- Count classes per day to verify accuracy
- Ensure that the classes are not overlapping with each other
- Ensure that the classes are not overlapping with the lunch break
- Ensure that the classes are not overlapping with the other classes
- Ensure that the classes are not overlapping with the other classes

Only return the JSON. Do not add explanation or comments.`;

function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  return mimeTypes[ext || ''] || 'image/jpeg';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image file.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imageBase64 = buffer.toString('base64');
    const mimeType = getMimeType(file.name);

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const output = response.text().trim();

    let cleanedOutput = output;
    
    if (cleanedOutput.startsWith('```json')) {
      cleanedOutput = cleanedOutput.substring(7);
    }
    if (cleanedOutput.endsWith('```')) {
      cleanedOutput = cleanedOutput.substring(0, cleanedOutput.length - 3);
    }
    
    cleanedOutput = cleanedOutput.trim();
    
    const jsonData = JSON.parse(cleanedOutput);

    return NextResponse.json({
      success: true,
      data: jsonData,
      message: `Successfully extracted ${jsonData.length} class sessions`
    });

  } catch (error) {
    console.error('Error processing timetable:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { 
          error: 'Failed to parse response as JSON. Please try uploading a clearer image.',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while processing the timetable.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 