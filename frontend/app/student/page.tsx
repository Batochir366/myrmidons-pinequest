import AttendanceSuccess from "@/components/AttendanceSuccess";
import FaceVerify from "@/components/FaceVerify";
import StudentIdInput from "@/components/StudentIdInput";

export default function Home() {
  return (
    <div>
      {/* <StudentIdInput /> */}
      {/* <FaceVerify /> */}
      <AttendanceSuccess studentId="24LP0001" status="Present" />
    </div>
  );
}
