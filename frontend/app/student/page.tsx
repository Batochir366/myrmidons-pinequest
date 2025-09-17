import AttendanceSystem from "@/components/AttendanceSystem"
import { Suspense } from "react"

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AttendanceSystem/>
    </Suspense>
  )
}
