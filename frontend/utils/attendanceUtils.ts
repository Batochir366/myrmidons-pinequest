// utils/attendanceUtils.ts
export const startCamera = async (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  setMessage: (msg: string) => void,
  streamRef: React.MutableRefObject<MediaStream | null>
) => {
  if (videoRef.current && !streamRef.current) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      videoRef.current.play();
    } catch (error) {
      setMessage("Камерт хандах боломжгүй. Камерын зөвшөөрөл өгнө үү.");
    }
  }
};

export const stopCamera = (
  streamRef: React.MutableRefObject<MediaStream | null>
) => {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }
};

export const captureAndVerify = async (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  studentId: string,
  setMessage: (msg: string) => void,
  setIsRecognizing: (state: boolean) => void,
  setRecognitionProgress: (progress: number) => void,
  onSuccess?: (name?: string) => void
): Promise<boolean> => {
  if (!videoRef.current || !canvasRef.current) return false;

  const canvas = canvasRef.current;
  canvas.width = videoRef.current.videoWidth;
  canvas.height = videoRef.current.videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
  const imageBase64 = canvas.toDataURL("image/jpeg", 0.8);

  try {
    const res = await fetch(
      "https://myrmidons-pinequest-production.up.railway.app/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, image_base64: imageBase64 }),
      }
    );

    const data = await res.json();

    if (data.success && data.verified) {
      if (onSuccess) {
        onSuccess(data.name);
      } else {
        setMessage(`Сайн байна уу, ${data.name || "Оюутан"}! Ирц бүртгэгдлээ.`);
      }
      return true;
    } else {
      setMessage(data.message || "Царай таних амжилтгүй боллоо.");
      setIsRecognizing(false);
      setRecognitionProgress(0);
      return false;
    }
  } catch (err) {
    console.error(err);
    setMessage("Сүлжээний алдаа, дахин оролдоно уу.");
    setIsRecognizing(false);
    setRecognitionProgress(0);
    return false;
  }
};

// New function to record attendance after face verification
export const recordAttendance = async (
  attendanceId: string,
  studentId: string,
  setMessage: (msg: string) => void
): Promise<boolean> => {
  try {
    // First check if student is in the classroom
    const checkRes = await fetch(
      `https://myrmidons-pinequest-backend.vercel.app/student/check/${studentId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!checkRes.ok) {
      setMessage("Та эхлээд хичээлд нэгдэнэ үү.");
      return false;
    }

    // Record attendance
    const attendanceRes = await fetch(
      "https://myrmidons-pinequest-backend.vercel.app/attendance",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId, studentId }),
      }
    );

    const attendanceData = await attendanceRes.json();

    if (attendanceRes.ok) {
      return true;
    } else {
      setMessage(attendanceData.message || "Ирц бүртгэхэд алдаа гарлаа.");
      return false;
    }
  } catch (error) {
    console.error("❌ Error recording attendance:", error);
    setMessage("Сүлжээний алдаа. Дахин оролдоно уу.");
    return false;
  }
};

export const simulateRecognition = (
  setIsRecognizing: (state: boolean) => void,
  setRecognitionProgress: React.Dispatch<React.SetStateAction<number>>,
  onComplete: () => void
) => {
  setIsRecognizing(true);
  setRecognitionProgress(0);

  const interval = setInterval(() => {
    setRecognitionProgress((prev) => {
      const next = typeof prev === "number" ? prev + 10 : 10;
      if (next >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 500);
        return 100;
      }
      return next;
    });
  }, 200);
};
