interface AttendanceState {
  attendanceId: string | null;
  selectedClassroomId: string;
  selectedLectureName: string;
  isRunning: boolean;
  students: any[];
  countdown: number;
  qrData: string | null;
  qrImage: string | null;
  qrSec: number;
  qrSvg: string;
  sessionStartTime?: number;
  lastActivity?: number;
  pipActive?: boolean;
}

interface Student {
  _id: string;
  studentName: string;
  studentId: string;
  time: string;
}

const STORAGE_KEYS = {
  ATTENDANCE_SESSION: "attendance_session_state",
  SELECTED_CLASSROOM: "selected_classroom",
  TEACHER_PREFERENCES: "teacher_preferences",
} as const;

const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export const useAttendanceStorage = () => {
  const saveState = (state: Partial<AttendanceState>) => {
    try {
      const currentState = restoreState();
      const newState = {
        ...currentState,
        ...state,
        lastActivity: Date.now(),
        sessionStartTime: currentState?.sessionStartTime || Date.now(),
      };

      localStorage.setItem(
        STORAGE_KEYS.ATTENDANCE_SESSION,
        JSON.stringify(newState)
      );

      console.log("Attendance state saved:", {
        attendanceId: newState.attendanceId,
        isRunning: newState.isRunning,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving attendance state:", error);
    }
  };

  const restoreState = (): AttendanceState | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_SESSION);
      if (!stored) return null;

      const state = JSON.parse(stored) as AttendanceState;
      const now = Date.now();
      const lastActivity = state.lastActivity || state.sessionStartTime || 0;

      if (now - lastActivity > SESSION_TIMEOUT) {
        console.log("Session expired, clearing stored state");
        clearSession();
        return null;
      }

      console.log("Attendance state restored:", {
        attendanceId: state.attendanceId,
        isRunning: state.isRunning,
        ageMinutes: Math.floor((now - lastActivity) / (1000 * 60)),
      });
      return {
        ...state,
        pipActive: state.pipActive ?? false,
      };
    } catch (error) {
      console.error("Error restoring attendance state:", error);
      clearSession();
      return null;
    }
  };

  const clearSession = (pipProviderRef?: React.RefObject<any>) => {
    try {
      if (pipProviderRef?.current?.closePiP) {
        pipProviderRef.current.closePiP();
        console.log("PiP closed successfully");
      }
      localStorage.removeItem(STORAGE_KEYS.ATTENDANCE_SESSION);
      console.log("Attendance session cleared");
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  };

  const hasActiveSession = (): boolean => {
    const state = restoreState();
    return state?.isRunning === true;
  };

  const getSessionDuration = (): number => {
    const state = restoreState();
    if (!state?.sessionStartTime) return 0;
    return Math.floor((Date.now() - state.sessionStartTime) / (1000 * 60));
  };

  const updateActivity = () => {
    try {
      const currentState = restoreState();
      if (currentState) {
        currentState.lastActivity = Date.now();
        localStorage.setItem(
          STORAGE_KEYS.ATTENDANCE_SESSION,
          JSON.stringify(currentState)
        );
      }
    } catch (error) {
      console.error("Error updating activity:", error);
    }
  };

  // Classroom Selection
  const saveSelectedClassroom = (classroomId: string, lectureName: string) => {
    try {
      const classroomData = {
        classroomId,
        lectureName,
        lastSelected: Date.now(),
      };
      localStorage.setItem(
        STORAGE_KEYS.SELECTED_CLASSROOM,
        JSON.stringify(classroomData)
      );

      const currentState = restoreState();
      if (currentState) {
        saveState({
          selectedClassroomId: classroomId,
          selectedLectureName: lectureName,
        });
      }
    } catch (error) {
      console.error("Error saving selected classroom:", error);
    }
  };

  const getSelectedClassroom = (): {
    classroomId: string;
    lectureName: string;
  } | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_CLASSROOM);
      if (stored) {
        const data = JSON.parse(stored);
        // Expire after 7 days
        if (Date.now() - data.lastSelected < 7 * 24 * 60 * 60 * 1000) {
          return {
            classroomId: data.classroomId,
            lectureName: data.lectureName,
          };
        }
      }
    } catch (error) {
      console.error("Error getting selected classroom:", error);
    }
    return null;
  };

  // Teacher Preferences
  const saveTeacherPreferences = (preferences: Record<string, any>) => {
    try {
      const current = getTeacherPreferences();
      const updated = { ...current, ...preferences, lastUpdated: Date.now() };
      localStorage.setItem(
        STORAGE_KEYS.TEACHER_PREFERENCES,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error("Error saving teacher preferences:", error);
    }
  };

  const getTeacherPreferences = (): Record<string, any> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TEACHER_PREFERENCES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error getting teacher preferences:", error);
    }
    return {};
  };

  // Cleanup
  const cleanupCorruptedEntries = () => {
    try {
      const lastCleanup = localStorage.getItem("last_cleanup");
      const now = Date.now();

      if (!lastCleanup || now - parseInt(lastCleanup) > CLEANUP_INTERVAL) {
        console.log("Starting cleanup process...");

        // Clean up expired sessions
        const state = restoreState();
        if (state) {
          const lastActivity =
            state.lastActivity || state.sessionStartTime || 0;
          if (now - lastActivity > SESSION_TIMEOUT) {
            clearSession();
            console.log("Cleaned up expired attendance session");
          }
        }

        // Clean up old classroom selections
        const classroom = getSelectedClassroom();
        if (!classroom) {
          localStorage.removeItem(STORAGE_KEYS.SELECTED_CLASSROOM);
        }

        localStorage.setItem("last_cleanup", now.toString());
        console.log("Cleanup completed successfully");
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  };

  // Migration utilities
  const migrateStorageVersion = () => {
    try {
      // If you had old keys, handle migration here
    } catch (error) {
      console.error("Error during storage migration:", error);
    }
  };

  const initializeStorage = () => {
    migrateStorageVersion();
    cleanupCorruptedEntries();
  };

  return {
    // Core state management
    saveState,
    restoreState,
    clearSession,
    hasActiveSession,
    getSessionDuration,
    updateActivity,

    // Classroom management
    saveSelectedClassroom,
    getSelectedClassroom,

    // Teacher preferences
    saveTeacherPreferences,
    getTeacherPreferences,

    // Maintenance
    cleanupCorruptedEntries,
    initializeStorage,
    migrateStorageVersion,
  };
};
