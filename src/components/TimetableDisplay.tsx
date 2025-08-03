'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

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

interface TimetableDisplayProps {
  data: ClassSession[];
  onDataChange?: (newData: ClassSession[]) => void;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const getClassTypeColor = (classType: string) => {
  const type = classType.toLowerCase();
  if (type.includes('lecture')) return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
  if (type.includes('tutorial')) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700';
  if (type.includes('lab') || type.includes('laboratory')) return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
  return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
};

function validateTimeFormat(timeStr: string): boolean {
  const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)?$|^(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/i;
  return timeRegex.test(timeStr);
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export default function TimetableDisplay({ data, onDataChange }: TimetableDisplayProps) {
  const { data: session } = useSession();
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<ClassSession | null>(null);
  const [showAddForm, setShowAddForm] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    events?: any[];
  } | null>(null);
  const [newClass, setNewClass] = useState<Partial<ClassSession>>({
    start_time: '',
    end_time: '',
    course_code: '',
    course_name: '',
    class_type: 'Lecture',
    location: '',
    instructor: ''
  });
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (data && data.length > 0) {
      try {
        localStorage.setItem('timetableData', JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }
  }, [data]);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('timetableData');
      if (savedData && onDataChange) {
        const parsedData = JSON.parse(savedData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          onDataChange(parsedData);
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }, [onDataChange]);

  const validateClassData = (classData: Partial<ClassSession>): {[key: string]: string} => {
    const errors: {[key: string]: string} = {};

    if (!classData.course_code?.trim()) {
      errors.course_code = 'Course code is required';
    }

    if (!classData.course_name?.trim()) {
      errors.course_name = 'Course name is required';
    }

    if (!classData.start_time?.trim()) {
      errors.start_time = 'Start time is required';
    } else if (!validateTimeFormat(classData.start_time)) {
      errors.start_time = 'Invalid time format (e.g., 9:00AM or 14:00)';
    }

    if (!classData.end_time?.trim()) {
      errors.end_time = 'End time is required';
    } else if (!validateTimeFormat(classData.end_time)) {
      errors.end_time = 'Invalid time format (e.g., 9:50AM or 14:50)';
    }

    if (classData.start_time && classData.end_time && validateTimeFormat(classData.start_time) && validateTimeFormat(classData.end_time)) {
      const startTime = classData.start_time.toLowerCase();
      const endTime = classData.end_time.toLowerCase();
      
      if (startTime === endTime) {
        errors.end_time = 'End time must be different from start time';
      }
    }

    if (!classData.location?.trim()) {
      errors.location = 'Location is required';
    }

    return errors;
  };

  const classesByDay = days.map(day => ({
    day,
    classes: data.filter(session => session.day === day)
  }));

  const handleEdit = (session: ClassSession, index: number) => {
    setEditingClass(`${session.day}-${index}`);
    setEditingData({ ...session });
    setValidationErrors({});
  };

  const handleSave = (day: string, index: number) => {
    if (editingData && onDataChange) {
      const errors = validateClassData(editingData);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      const sanitizedData: ClassSession = {
        ...editingData,
        course_code: sanitizeInput(editingData.course_code),
        course_name: sanitizeInput(editingData.course_name),
        location: sanitizeInput(editingData.location),
        instructor: sanitizeInput(editingData.instructor || ''),
        start_time: editingData.start_time.trim(),
        end_time: editingData.end_time.trim()
      };

      const newData = [...data];
      const dayClasses = newData.filter(s => s.day === day);
      const globalIndex = newData.findIndex(s => s === dayClasses[index]);
      newData[globalIndex] = sanitizedData;
      onDataChange(newData);
    }
    setEditingClass(null);
    setEditingData(null);
    setValidationErrors({});
  };

  const handleCancel = () => {
    setEditingClass(null);
    setEditingData(null);
    setValidationErrors({});
  };

  const handleDelete = (day: string, index: number) => {
    if (onDataChange) {
      const newData = [...data];
      const dayClasses = newData.filter(s => s.day === day);
      const globalIndex = newData.findIndex(s => s === dayClasses[index]);
      newData.splice(globalIndex, 1);
      onDataChange(newData);
    }
  };

  const handleAdd = (day: string) => {
    const errors = validateClassData(newClass);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (newClass.course_code && newClass.start_time && newClass.end_time && onDataChange) {
      const classToAdd: ClassSession = {
        day,
        start_time: newClass.start_time.trim(),
        end_time: newClass.end_time.trim(),
        course_code: sanitizeInput(newClass.course_code),
        course_name: sanitizeInput(newClass.course_name || ''),
        class_type: newClass.class_type || 'Lecture',
        location: sanitizeInput(newClass.location || ''),
        instructor: sanitizeInput(newClass.instructor || '')
      };
      
      const newData = [...data, classToAdd];
      onDataChange(newData);
      setNewClass({
        start_time: '',
        end_time: '',
        course_code: '',
        course_name: '',
        class_type: 'Lecture',
        location: '',
        instructor: ''
      });
      setShowAddForm(null);
      setValidationErrors({});
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(null);
    setNewClass({
      start_time: '',
      end_time: '',
      course_code: '',
      course_name: '',
      class_type: 'Lecture',
      location: '',
      instructor: ''
    });
    setValidationErrors({});
  };

  const handleSyncToCalendar = async () => {
    if (!session) return;

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/calendar/add-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classes: data }),
      });

      const result = await response.json();

      if (response.ok) {
        setSyncResult({
          success: true,
          message: result.message,
          events: result.events,
        });
      } else {
        setSyncResult({
          success: false,
          message: result.error || 'Failed to sync with Google Calendar',
        });
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: 'Network error occurred while syncing',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const renderInputField = (
    field: keyof ClassSession,
    placeholder: string,
    value: string,
    onChange: (value: string) => void,
    isRequired: boolean = true
  ) => (
    <div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 text-sm border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
          validationErrors[field] 
            ? 'border-red-300 dark:border-red-600' 
            : 'border-gray-200 dark:border-gray-600'
        }`}
        aria-invalid={validationErrors[field] ? 'true' : 'false'}
        aria-describedby={validationErrors[field] ? `${field}-error` : undefined}
      />
      {validationErrors[field] && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400" id={`${field}-error`}>
          {validationErrors[field]}
        </p>
      )}
    </div>
  );

  const renderClassCard = (session: ClassSession, day: string, index: number) => {
    const isEditing = editingClass === `${day}-${index}`;
    
    if (isEditing && editingData) {
      return (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-blue-300 dark:border-blue-600 rounded-2xl p-6 shadow-lg hover-lift">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {renderInputField(
                'start_time',
                'Start Time',
                editingData.start_time,
                (value) => setEditingData({ ...editingData, start_time: value })
              )}
              {renderInputField(
                'end_time',
                'End Time',
                editingData.end_time,
                (value) => setEditingData({ ...editingData, end_time: value })
              )}
            </div>
            
            {renderInputField(
              'course_code',
              'Course Code',
              editingData.course_code,
              (value) => setEditingData({ ...editingData, course_code: value })
            )}
            {renderInputField(
              'course_name',
              'Course Name',
              editingData.course_name,
              (value) => setEditingData({ ...editingData, course_name: value })
            )}
            
            <select
              value={editingData.class_type}
              onChange={(e) => setEditingData({ ...editingData, class_type: e.target.value })}
              className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="Lecture">Lecture</option>
              <option value="Tutorial">Tutorial</option>
              <option value="Laboratory">Laboratory</option>
              <option value="Lab">Lab</option>
            </select>
            
            {renderInputField(
              'location',
              'Location',
              editingData.location,
              (value) => setEditingData({ ...editingData, location: value })
            )}
            {renderInputField(
              'instructor',
              'Instructor',
              editingData.instructor || '',
              (value) => setEditingData({ ...editingData, instructor: value }),
              false
            )}
            
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => handleSave(day, index)}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-md"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover-lift group">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
              {session.start_time} - {session.end_time}
            </div>
            <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${getClassTypeColor(session.class_type)}`}>
              {session.class_type}
            </span>
          </div>
          
          <div>
            <div className="font-bold text-gray-900 dark:text-white text-lg">
              {session.course_code}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {session.course_name}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="font-medium">{session.location}</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="font-medium">{session.instructor || 'Staff'}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex space-x-3">
            <button
              onClick={() => handleEdit(session, index)}
              className="flex-1 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-xl transition-all duration-200 border border-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700 hover:shadow-md"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => handleDelete(day, index)}
              className="flex-1 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-xl transition-all duration-200 border border-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 dark:border-red-700 hover:shadow-md"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAddForm = (day: string) => {
    if (showAddForm !== day) return null;

    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-emerald-300 dark:border-emerald-600 rounded-2xl p-6 shadow-lg hover-lift">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Class
          </h4>
            
          <div className="grid grid-cols-2 gap-4">
            {renderInputField(
              'start_time',
              'Start Time (e.g., 9:00AM)',
              newClass.start_time || '',
              (value) => setNewClass({ ...newClass, start_time: value })
            )}
            {renderInputField(
              'end_time',
              'End Time (e.g., 9:50AM)',
              newClass.end_time || '',
              (value) => setNewClass({ ...newClass, end_time: value })
            )}
          </div>
          
          {renderInputField(
            'course_code',
            'Course Code (e.g., CS F213)',
            newClass.course_code || '',
            (value) => setNewClass({ ...newClass, course_code: value })
          )}
          {renderInputField(
            'course_name',
            'Course Name',
            newClass.course_name || '',
            (value) => setNewClass({ ...newClass, course_name: value })
          )}
          
          <select
            value={newClass.class_type || 'Lecture'}
            onChange={(e) => setNewClass({ ...newClass, class_type: e.target.value })}
            className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          >
            <option value="Lecture">Lecture</option>
            <option value="Tutorial">Tutorial</option>
            <option value="Laboratory">Laboratory</option>
            <option value="Lab">Lab</option>
          </select>
          
          {renderInputField(
            'location',
            'Location (e.g., Room 101)',
            newClass.location || '',
            (value) => setNewClass({ ...newClass, location: value })
          )}
          {renderInputField(
            'instructor',
            'Instructor (or "Staff")',
            newClass.instructor || '',
            (value) => setNewClass({ ...newClass, instructor: value }),
            false
          )}
          
          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => handleAdd(day)}
              className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-md"
            >
              Add Class
            </button>
            <button
              onClick={handleCancelAdd}
              className="flex-1 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-md"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-3">
          Your Timetable
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {data.length} class sessions extracted successfully
          {onDataChange && (
            <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
              • Click on any class to edit or delete
            </span>
          )}
        </p>
      </div>

      <div className="mb-8 p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Class Types
        </h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lecture</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tutorial</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-purple-500 rounded-full shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lab</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {classesByDay.map(({ day, classes }, dayIndex) => (
          <div key={day} className="space-y-6 animate-fade-in-up" style={{ animationDelay: `${dayIndex * 100}ms` }}>
            <div className="text-center">
              <h3 className="font-bold text-gray-900 dark:text-white text-2xl mb-2">
                {day}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">
                {classes.length} class{classes.length !== 1 ? 'es' : ''}
              </p>
              {onDataChange && (
                <button
                  onClick={() => setShowAddForm(showAddForm === day ? null : day)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover-lift"
                >
                  {showAddForm === day ? 'Cancel' : '+ Add Class'}
                </button>
              )}
            </div>
            
            <div className="space-y-6">
              {renderAddForm(day)}
              
              {classes.length === 0 ? (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100/50 dark:border-gray-700/50">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-lg font-medium">No classes scheduled</p>
                  <p className="text-sm mt-1">Add your first class to get started</p>
                </div>
              ) : (
                classes
                  .sort((a, b) => {
                    const timeA = new Date(`2000-01-01 ${a.start_time}`);
                    const timeB = new Date(`2000-01-01 ${b.start_time}`);
                    return timeA.getTime() - timeB.getTime();
                  })
                  .map((session, index) => (
                    <div key={`${day}-${session.course_code}-${session.start_time}-${index}`} className="animate-slide-in-right" style={{ animationDelay: `${(dayIndex * 100) + (index * 50)}ms` }}>
                      {renderClassCard(session, day, index)}
                    </div>
                  ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 mb-8 p-6 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/50 rounded-2xl backdrop-blur-sm">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
              Important: Verify Your Data
            </h4>
            <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
              While our automated system strives for accuracy, it may occasionally make mistakes when extracting timetable information. 
              Please review and cross-verify all class details before downloading or using this data for important purposes.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
        <button
          onClick={() => {
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'timetable.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }}
          className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover-lift"
        >
          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download JSON
        </button>

        {session && (
          <button
            onClick={handleSyncToCalendar}
            disabled={isSyncing}
            className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover-lift"
          >
            {isSyncing ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Syncing...
              </>
            ) : (
              <>
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Add to Google Calendar
              </>
            )}
          </button>
        )}
      </div>

      {syncResult && (
        <div className={`mt-8 rounded-2xl p-6 backdrop-blur-sm ${
          syncResult.success 
            ? 'bg-green-50/80 dark:bg-green-900/20 border border-green-200/50 dark:border-green-700/50' 
            : 'bg-red-50/80 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/50'
        }`}>
          <div className="flex items-start space-x-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              syncResult.success 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <svg className={`w-5 h-5 ${
                syncResult.success 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {syncResult.success ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
            </div>
            <div>
              <h4 className={`text-lg font-semibold mb-2 ${
                syncResult.success 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {syncResult.success ? 'Sync Successful' : 'Sync Failed'}
              </h4>
              <p className={`${
                syncResult.success 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {syncResult.message}
              </p>
              {syncResult.success && syncResult.events && (
                <div className="mt-4">
                  <p className="text-sm text-green-600 dark:text-green-400 mb-3 font-medium">
                    Added events:
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {syncResult.events.map((event, index) => (
                      <div key={index} className="text-sm text-green-600 dark:text-green-400 bg-green-100/50 dark:bg-green-900/30 px-3 py-2 rounded-lg">
                        {event.summary}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 