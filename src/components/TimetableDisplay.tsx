'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

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

  const classesByDay = days.map(day => ({
    day,
    classes: data.filter(session => session.day === day)
  }));

  const handleEdit = (session: ClassSession, index: number) => {
    setEditingClass(`${session.day}-${index}`);
    setEditingData({ ...session });
  };

  const handleSave = (day: string, index: number) => {
    if (editingData && onDataChange) {
      const newData = [...data];
      const dayClasses = newData.filter(s => s.day === day);
      const globalIndex = newData.findIndex(s => s === dayClasses[index]);
      newData[globalIndex] = editingData;
      onDataChange(newData);
    }
    setEditingClass(null);
    setEditingData(null);
  };

  const handleCancel = () => {
    setEditingClass(null);
    setEditingData(null);
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
    if (newClass.course_code && newClass.start_time && newClass.end_time && onDataChange) {
      const classToAdd: ClassSession = {
        day,
        start_time: newClass.start_time || '',
        end_time: newClass.end_time || '',
        course_code: newClass.course_code || '',
        course_name: newClass.course_name || '',
        class_type: newClass.class_type || 'Lecture',
        location: newClass.location || '',
        instructor: newClass.instructor || 'Staff'
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

  const renderClassCard = (session: ClassSession, day: string, index: number) => {
    const isEditing = editingClass === `${day}-${index}`;
    
    if (isEditing && editingData) {
      return (
        <div className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-600 rounded-xl p-4 shadow-sm">
                  <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Start Time"
              value={editingData.start_time}
              onChange={(e) => setEditingData({ ...editingData, start_time: e.target.value })}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <input
              type="text"
              placeholder="End Time"
              value={editingData.end_time}
              onChange={(e) => setEditingData({ ...editingData, end_time: e.target.value })}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          <input
            type="text"
            placeholder="Course Code"
            value={editingData.course_code}
            onChange={(e) => setEditingData({ ...editingData, course_code: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <input
            type="text"
            placeholder="Course Name"
            value={editingData.course_name}
            onChange={(e) => setEditingData({ ...editingData, course_name: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          
          <select
            value={editingData.class_type}
            onChange={(e) => setEditingData({ ...editingData, class_type: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="Lecture">Lecture</option>
            <option value="Tutorial">Tutorial</option>
            <option value="Laboratory">Laboratory</option>
            <option value="Lab">Lab</option>
          </select>
          
          <input
            type="text"
            placeholder="Location"
            value={editingData.location}
            onChange={(e) => setEditingData({ ...editingData, location: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <input
            type="text"
            placeholder="Instructor"
            value={editingData.instructor}
            onChange={(e) => setEditingData({ ...editingData, instructor: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          
          <div className="flex space-x-2 pt-2">
            <button
              onClick={() => handleSave(day, index)}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {session.start_time} - {session.end_time}
          </div>
          
          <div>
            <div className="font-bold text-gray-900 dark:text-white text-base">
              {session.course_code}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {session.course_name}
            </div>
          </div>
          
          <div>
            <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getClassTypeColor(session.class_type)}`}>
              {session.class_type}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{session.location}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{session.instructor}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex space-x-2">
            <button
              onClick={() => handleEdit(session, index)}
              className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-colors border border-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => handleDelete(day, index)}
              className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-lg transition-colors border border-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 dark:border-red-700"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="bg-white dark:bg-gray-800 border-2 border-emerald-200 dark:border-emerald-600 rounded-xl p-4 shadow-sm">
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Add New Class</h4>
            
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Start Time (e.g., 9:00AM)"
              value={newClass.start_time || ''}
              onChange={(e) => setNewClass({ ...newClass, start_time: e.target.value })}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            <input
              type="text"
              placeholder="End Time (e.g., 9:50AM)"
              value={newClass.end_time || ''}
              onChange={(e) => setNewClass({ ...newClass, end_time: e.target.value })}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          
          <input
            type="text"
            placeholder="Course Code (e.g., CS F213)"
            value={newClass.course_code || ''}
            onChange={(e) => setNewClass({ ...newClass, course_code: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          <input
            type="text"
            placeholder="Course Name"
            value={newClass.course_name || ''}
            onChange={(e) => setNewClass({ ...newClass, course_name: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          
          <select
            value={newClass.class_type || 'Lecture'}
            onChange={(e) => setNewClass({ ...newClass, class_type: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          >
            <option value="Lecture">Lecture</option>
            <option value="Tutorial">Tutorial</option>
            <option value="Laboratory">Laboratory</option>
            <option value="Lab">Lab</option>
          </select>
          
          <input
            type="text"
            placeholder="Location (e.g., Room 101)"
            value={newClass.location || ''}
            onChange={(e) => setNewClass({ ...newClass, location: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          <input
            type="text"
            placeholder="Instructor (or 'Staff')"
            value={newClass.instructor || ''}
            onChange={(e) => setNewClass({ ...newClass, instructor: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          
          <div className="flex space-x-2 pt-2">
            <button
              onClick={() => handleAdd(day)}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Add Class
            </button>
            <button
              onClick={handleCancelAdd}
              className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Your Timetable
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {data.length} class sessions extracted successfully
          {onDataChange && (
            <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
              • Click on any class to edit or delete
            </span>
          )}
        </p>
      </div>

      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Class Types</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Lecture</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Tutorial</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Lab</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {classesByDay.map(({ day, classes }) => (
          <div key={day} className="space-y-4">
            <div className="text-center">
              <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-1">
                {day}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {classes.length} class{classes.length !== 1 ? 'es' : ''}
              </p>
              {onDataChange && (
                <button
                  onClick={() => setShowAddForm(showAddForm === day ? null : day)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {showAddForm === day ? 'Cancel' : '+ Add Class'}
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {renderAddForm(day)}
              
              {classes.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-sm">No classes scheduled</p>
                </div>
              ) : (
                classes
                  .sort((a, b) => {
                    const timeA = new Date(`2000-01-01 ${a.start_time}`);
                    const timeB = new Date(`2000-01-01 ${b.start_time}`);
                    return timeA.getTime() - timeB.getTime();
                  })
                  .map((session, index) => (
                    <div key={`${day}-${session.course_code}-${session.start_time}-${index}`}>
                      {renderClassCard(session, day, index)}
                    </div>
                  ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
              Important: Verify Your Data
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              While our automated system strives for accuracy, it may occasionally make mistakes when extracting timetable information. 
              Please review and cross-verify all class details before downloading or using this data for important purposes.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download JSON
        </button>

        {session && (
          <button
            onClick={handleSyncToCalendar}
            disabled={isSyncing}
            className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors shadow-sm hover:shadow-md"
          >
            {isSyncing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Syncing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Add to Google Calendar
              </>
            )}
          </button>
        )}
      </div>

      {syncResult && (
        <div className={`mt-6 rounded-lg p-4 ${
          syncResult.success 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
        }`}>
          <div className="flex items-start space-x-3">
            <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              syncResult.success 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {syncResult.success ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
            <div>
              <h4 className={`text-sm font-semibold mb-1 ${
                syncResult.success 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {syncResult.success ? 'Sync Successful' : 'Sync Failed'}
              </h4>
              <p className={`text-sm ${
                syncResult.success 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {syncResult.message}
              </p>
              {syncResult.success && syncResult.events && (
                <div className="mt-3">
                  <p className="text-xs text-green-600 dark:text-green-400 mb-2">
                    Added events:
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {syncResult.events.map((event, index) => (
                      <div key={index} className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
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