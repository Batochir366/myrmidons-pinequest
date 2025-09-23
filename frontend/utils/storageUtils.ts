// Enhanced storage utilities with persistent QR timing and PiP state

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
  sessionStartTime?: number;
  lastActivity?: number;
}

interface PiPState {
  isActive: boolean;
  qrData?: string;
  timestamp: number;
  attendanceId: string;
  qrSec: number;
}

interface Student {
  _id: string;
  studentName: string;
  studentId: string;
  time: string;
}

const STORAGE_KEYS = {
  ATTENDANCE_SESSION: "attendance_session_state",
  QR_SEC: "qr_generation_seconds_v2", // Updated key for better persistence
  SELECTED_CLASSROOM: "selected_classroom",
  TEACHER_PREFERENCES: "teacher_preferences",
  PIP_STATE: "pip_state_v2",
} as const;

const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
const PIP_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export const useAttendanceStorage = () => {
  // Enhanced state saving with better error handling
  const saveState = (state: Partial<AttendanceState>) => {
    try {
      const currentState = restoreState() || {};
      const newState = {
        ...currentState,
        ...state,
        lastActivity: Date.now(),
      };

      // Persist QR settings separately for global access
      if (state.qrSec !== undefined && state.qrSec > 0 && state.qrSec <= 300) {
        localStorage.setItem(STORAGE_KEYS.QR_SEC, state.qrSec.toString());
        console.log(`QR generation time persisted globally: ${state.qrSec}s`);
      }

      localStorage.setItem(
        STORAGE_KEYS.ATTENDANCE_SESSION,
        JSON.stringify(newState)
      );

      console.log("Enhanced attendance state saved:", {
        attendanceId: newState.attendanceId,
        isRunning: newState.isRunning,
        qrSec: newState.qrSec,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving attendance state:", error);
      // Attempt to save critical data only
      try {
        if (state.qrSec) {
          localStorage.setItem(STORAGE_KEYS.QR_SEC, state.qrSec.toString());
        }
      } catch (fallbackError) {
        console.error("Failed to save even critical data:", fallbackError);
      }
    }
  };

  const restoreState = (): AttendanceState | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_SESSION);
      if (!stored) return null;

      const state = JSON.parse(stored) as AttendanceState;

      // Check if session has expired
      const now = Date.now();
      const lastActivity = state.lastActivity || state.sessionStartTime || 0;

      if (now - lastActivity > SESSION_TIMEOUT) {
        console.log("Session expired, clearing stored state");
        clearSession();
        return null;
      }

      // Always load the latest QR settings
      const globalQrSec = getQrSettings();
      state.qrSec = globalQrSec;

      console.log("Attendance state restored:", {
        attendanceId: state.attendanceId,
        isRunning: state.isRunning,
        qrSec: state.qrSec,
        ageMinutes: Math.floor((now - lastActivity) / (1000 * 60)),
      });

      return state;
    } catch (error) {
      console.error("Error restoring attendance state:", error);
      clearSession();
      return null;
    }
  };

  const clearSession = () => {
    try {
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

  // Enhanced QR Settings Management with validation
  const saveQrSettings = (qrSec: number) => {
    try {
      // Validate input
      if (isNaN(qrSec) || qrSec < 1 || qrSec > 300) {
        console.error("Invalid QR seconds value:", qrSec);
        return false;
      }

      localStorage.setItem(STORAGE_KEYS.QR_SEC, qrSec.toString());

      // Also update current session if active
      const currentState = restoreState();
      if (currentState) {
        currentState.qrSec = qrSec;
        localStorage.setItem(
          STORAGE_KEYS.ATTENDANCE_SESSION,
          JSON.stringify(currentState)
        );
      }

      console.log(`QR settings saved: ${qrSec} seconds`);
      return true;
    } catch (error) {
      console.error("Error saving QR settings:", error);
      return false;
    }
  };

  const getQrSettings = (): number => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.QR_SEC);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 300) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Error getting QR settings:", error);
    }

    // Return default and save it
    const defaultValue = 5;
    try {
      localStorage.setItem(STORAGE_KEYS.QR_SEC, defaultValue.toString());
    } catch (error) {
      console.error("Error saving default QR settings:", error);
    }

    return defaultValue;
  };

  // PiP State Management
  const savePiPState = (
    isActive: boolean,
    additionalData?: Partial<PiPState>
  ) => {
    try {
      const currentState = restoreState();
      const pipState: PiPState = {
        isActive,
        timestamp: Date.now(),
        attendanceId: currentState?.attendanceId || "",
        qrSec: currentState?.qrSec || getQrSettings(),
        ...additionalData,
      };

      localStorage.setItem(STORAGE_KEYS.PIP_STATE, JSON.stringify(pipState));
      console.log(`PiP state saved: ${isActive ? "active" : "inactive"}`);

      return true;
    } catch (error) {
      console.error("Error saving PiP state:", error);
      return false;
    }
  };

  const getPiPState = (): PiPState | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PIP_STATE);
      if (!stored) return null;

      const state = JSON.parse(stored) as PiPState;

      // Check if PiP state is not too old
      if (Date.now() - state.timestamp > PIP_TIMEOUT) {
        console.log("PiP state expired, clearing");
        clearPiPState();
        return null;
      }

      // Ensure current QR settings are used
      state.qrSec = getQrSettings();

      return state;
    } catch (error) {
      console.error("Error getting PiP state:", error);
      clearPiPState();
      return null;
    }
  };

  const clearPiPState = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.PIP_STATE);
      console.log("PiP state cleared");
    } catch (error) {
      console.error("Error clearing PiP state:", error);
    }
  };

  // Classroom Selection Persistence
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

      // Update current session
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
        // Check if selection is not too old (7 days)
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

  // Enhanced cleanup with better error handling
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

        // Clean up expired PiP state
        const pipState = getPiPState();
        if (!pipState) {
          clearPiPState();
        }

        // Clean up old classroom selections
        const classroom = getSelectedClassroom();
        if (!classroom) {
          localStorage.removeItem(STORAGE_KEYS.SELECTED_CLASSROOM);
        }

        // Validate QR settings
        const qrSec = getQrSettings();
        if (qrSec < 1 || qrSec > 300) {
          console.log("Invalid QR settings detected, resetting to default");
          saveQrSettings(5);
        }

        localStorage.setItem("last_cleanup", now.toString());
        console.log("Cleanup completed successfully");
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
      // Force cleanup critical items
      try {
        const qrSec = parseInt(
          localStorage.getItem(STORAGE_KEYS.QR_SEC) || "5"
        );
        if (isNaN(qrSec) || qrSec < 1 || qrSec > 300) {
          localStorage.setItem(STORAGE_KEYS.QR_SEC, "5");
        }
      } catch (criticalError) {
        console.error("Critical cleanup failed:", criticalError);
      }
    }
  };

  // Migration utilities for version updates
  const migrateStorageVersion = () => {
    try {
      // Migrate old QR settings key if exists
      const oldQrSec = localStorage.getItem("qr_generation_seconds");
      if (oldQrSec && !localStorage.getItem(STORAGE_KEYS.QR_SEC)) {
        localStorage.setItem(STORAGE_KEYS.QR_SEC, oldQrSec);
        localStorage.removeItem("qr_generation_seconds");
        console.log("Migrated QR settings to new version");
      }

      // Migrate old PiP state if exists
      const oldPipState = localStorage.getItem("pip_state");
      if (oldPipState && !localStorage.getItem(STORAGE_KEYS.PIP_STATE)) {
        localStorage.removeItem("pip_state");
        console.log("Cleared old PiP state");
      }
    } catch (error) {
      console.error("Error during storage migration:", error);
    }
  };

  // Initialize storage with migration
  const initializeStorage = () => {
    migrateStorageVersion();
    cleanupCorruptedEntries();

    // Ensure QR settings exist
    const qrSec = getQrSettings();
    console.log(`Storage initialized with QR interval: ${qrSec}s`);
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

    // QR settings (enhanced)
    saveQrSettings,
    getQrSettings,

    // PiP management
    savePiPState,
    getPiPState,
    clearPiPState,

    // Teacher preferences
    saveTeacherPreferences,
    getTeacherPreferences,

    // Maintenance
    cleanupCorruptedEntries,
    initializeStorage,
    migrateStorageVersion,
  };
};
