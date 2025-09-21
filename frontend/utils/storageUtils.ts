export const ATTENDANCE_STORAGE_KEYS = {
  ATTENDANCE_ID: "attendance_id",
  SELECTED_CLASSROOM: "selected_classroom_id",
  SELECTED_LECTURE_NAME: "selected_lecture_name",
  IS_RUNNING: "attendance_is_running",
  STUDENTS: "attendance_students",
  COUNTDOWN: "attendance_countdown",
  QR_DATA: "attendance_qr_data",
  QR_IMAGE: "attendance_qr_image",
  SESSION_START_TIME: "attendance_session_start_time",
  LAST_ACTIVITY: "attendance_last_activity",
} as const;

export interface AttendanceSessionState {
  attendanceId: string | null;
  selectedClassroomId: string;
  selectedLectureName: string;
  isRunning: boolean;
  students: Array<{
    _id: string;
    studentName: string;
    studentId: string;
    time: string;
  }>;
  countdown: number;
  qrData: string | null;
  qrImage: string | null;
  sessionStartTime: number | null;
  lastActivity: number;
}

class AttendanceStorageManager {
  private static instance: AttendanceStorageManager;

  public static getInstance(): AttendanceStorageManager {
    if (!AttendanceStorageManager.instance) {
      AttendanceStorageManager.instance = new AttendanceStorageManager();
    }
    return AttendanceStorageManager.instance;
  }

  private saveToStorage(key: string, value: any): void {
    try {
      // Don't save undefined or null values
      if (value === undefined || value === null) {
        localStorage.removeItem(key);
        return;
      }
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }

  private getFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);

      // Check for null/undefined or invalid JSON strings
      if (!item || item === "undefined" || item === "null") {
        return defaultValue;
      }

      return JSON.parse(item);
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      // Clean up the corrupted item
      try {
        localStorage.removeItem(key);
      } catch (cleanupError) {
        console.error(
          "Error cleaning up corrupted localStorage item:",
          cleanupError
        );
      }
      return defaultValue;
    }
  }

  public saveAttendanceState(state: Partial<AttendanceSessionState>): void {
    Object.entries(state).forEach(([key, value]) => {
      const storageKey = this.getStorageKeyByStateKey(key);
      if (storageKey && value !== undefined) {
        // Only save defined values
        this.saveToStorage(storageKey, value);
      }
    });

    // Always update last activity
    this.saveToStorage(ATTENDANCE_STORAGE_KEYS.LAST_ACTIVITY, Date.now());
  }

  public restoreAttendanceState(): AttendanceSessionState | null {
    // Clean up any corrupted entries first
    this.cleanupCorruptedEntries();

    const sessionStartTime = this.getFromStorage(
      ATTENDANCE_STORAGE_KEYS.SESSION_START_TIME,
      null
    );
    // Fix: Provide a default value for lastActivity to ensure it's always a number
    const lastActivity = this.getFromStorage(
      ATTENDANCE_STORAGE_KEYS.LAST_ACTIVITY,
      Date.now() // Default to current time if not found
    );
    const isRunning = this.getFromStorage(
      ATTENDANCE_STORAGE_KEYS.IS_RUNNING,
      false
    );

    // Check if session is still valid
    const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const now = Date.now();
    const isSessionExpired =
      sessionStartTime && now - sessionStartTime > SESSION_TIMEOUT;
    const isInactive = lastActivity && now - lastActivity > INACTIVITY_TIMEOUT;

    if (!isRunning || isSessionExpired || isInactive) {
      if (isSessionExpired) {
        console.log("Attendance session expired (2+ hours old)");
      } else if (isInactive) {
        console.log("Attendance session expired (30+ minutes inactive)");
      }
      this.clearAttendanceSession();
      return null;
    }

    // Restore the session
    return {
      attendanceId: this.getFromStorage(
        ATTENDANCE_STORAGE_KEYS.ATTENDANCE_ID,
        null
      ),
      selectedClassroomId: this.getFromStorage(
        ATTENDANCE_STORAGE_KEYS.SELECTED_CLASSROOM,
        ""
      ),
      selectedLectureName: this.getFromStorage(
        ATTENDANCE_STORAGE_KEYS.SELECTED_LECTURE_NAME,
        ""
      ),
      isRunning: this.getFromStorage(ATTENDANCE_STORAGE_KEYS.IS_RUNNING, false),
      students: this.getFromStorage(ATTENDANCE_STORAGE_KEYS.STUDENTS, []),
      countdown: this.getFromStorage(ATTENDANCE_STORAGE_KEYS.COUNTDOWN, 5),
      qrData: this.getFromStorage(ATTENDANCE_STORAGE_KEYS.QR_DATA, null),
      qrImage: this.getFromStorage(ATTENDANCE_STORAGE_KEYS.QR_IMAGE, null),
      sessionStartTime: sessionStartTime,
      lastActivity: lastActivity, // This is now guaranteed to be a number
    };
  }

  public clearAttendanceSession(): void {
    Object.values(ATTENDANCE_STORAGE_KEYS).forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error removing localStorage key ${key}:`, error);
      }
    });
  }

  // Clean up any corrupted entries
  public cleanupCorruptedEntries(): void {
    Object.values(ATTENDANCE_STORAGE_KEYS).forEach((key) => {
      try {
        const item = localStorage.getItem(key);
        if (item === "undefined" || item === "null") {
          console.log(`Cleaning up corrupted entry: ${key}`);
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.error(
          `Error checking/cleaning localStorage key ${key}:`,
          error
        );
        try {
          localStorage.removeItem(key);
        } catch (cleanupError) {
          console.error(`Error removing corrupted key ${key}:`, cleanupError);
        }
      }
    });
  }

  public updateActivity(): void {
    this.saveToStorage(ATTENDANCE_STORAGE_KEYS.LAST_ACTIVITY, Date.now());
  }

  public getSelectedClassroom(): { id: string; name: string } {
    return {
      id: this.getFromStorage(ATTENDANCE_STORAGE_KEYS.SELECTED_CLASSROOM, ""),
      name: this.getFromStorage(
        ATTENDANCE_STORAGE_KEYS.SELECTED_LECTURE_NAME,
        ""
      ),
    };
  }

  public saveSelectedClassroom(id: string, name: string): void {
    this.saveToStorage(ATTENDANCE_STORAGE_KEYS.SELECTED_CLASSROOM, id);
    this.saveToStorage(ATTENDANCE_STORAGE_KEYS.SELECTED_LECTURE_NAME, name);
  }

  private getStorageKeyByStateKey(stateKey: string): string | null {
    const mapping: Record<string, string> = {
      attendanceId: ATTENDANCE_STORAGE_KEYS.ATTENDANCE_ID,
      selectedClassroomId: ATTENDANCE_STORAGE_KEYS.SELECTED_CLASSROOM,
      selectedLectureName: ATTENDANCE_STORAGE_KEYS.SELECTED_LECTURE_NAME,
      isRunning: ATTENDANCE_STORAGE_KEYS.IS_RUNNING,
      students: ATTENDANCE_STORAGE_KEYS.STUDENTS,
      countdown: ATTENDANCE_STORAGE_KEYS.COUNTDOWN,
      qrData: ATTENDANCE_STORAGE_KEYS.QR_DATA,
      qrImage: ATTENDANCE_STORAGE_KEYS.QR_IMAGE,
      sessionStartTime: ATTENDANCE_STORAGE_KEYS.SESSION_START_TIME,
    };

    return mapping[stateKey] || null;
  }

  // Check if there's an active session
  public hasActiveSession(): boolean {
    const state = this.restoreAttendanceState();
    return state !== null && state.isRunning;
  }

  // Get session duration in minutes
  public getSessionDuration(): number {
    const sessionStartTime = this.getFromStorage(
      ATTENDANCE_STORAGE_KEYS.SESSION_START_TIME,
      null
    );
    if (!sessionStartTime) return 0;

    return Math.floor((Date.now() - sessionStartTime) / (1000 * 60));
  }
}

export const attendanceStorage = AttendanceStorageManager.getInstance();
import { useEffect, useCallback } from "react";

export function useAttendanceStorage() {
  const updateActivity = useCallback(() => {
    attendanceStorage.updateActivity();
  }, []);
  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => updateActivity();

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [updateActivity]);

  return {
    saveState: attendanceStorage.saveAttendanceState.bind(attendanceStorage),
    restoreState:
      attendanceStorage.restoreAttendanceState.bind(attendanceStorage),
    clearSession:
      attendanceStorage.clearAttendanceSession.bind(attendanceStorage),
    hasActiveSession:
      attendanceStorage.hasActiveSession.bind(attendanceStorage),
    getSessionDuration:
      attendanceStorage.getSessionDuration.bind(attendanceStorage),
    getSelectedClassroom:
      attendanceStorage.getSelectedClassroom.bind(attendanceStorage),
    saveSelectedClassroom:
      attendanceStorage.saveSelectedClassroom.bind(attendanceStorage),
    cleanupCorruptedEntries:
      attendanceStorage.cleanupCorruptedEntries.bind(attendanceStorage),
    updateActivity,
  };
}
