"use client";
export const dynamic = "force-dynamic";

import React, {
  useState,
  useEffect,
  ReactNode,
  MouseEventHandler,
} from "react";
import { GraduationCap, Users, Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  classroomId: string;
  lectureName: string;
  teacherName: string;
  iat?: number;
  exp?: number;
}

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card = ({ children, className = "" }: CardProps) => (
  <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: CardProps) => (
  <div className={`p-6 pb-0 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }: CardProps) => (
  <h3
    className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
  >
    {children}
  </h3>
);

const CardDescription = ({ children, className = "" }: CardProps) => (
  <p className={`text-sm text-gray-600 ${className}`}>{children}</p>
);

const CardContent = ({ children, className = "" }: CardProps) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

interface ButtonProps {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  variant?: "default" | "outline" | "secondary";
  className?: string;
  disabled?: boolean;
}

const Button = ({
  children,
  onClick,
  variant = "default",
  className = "",
  disabled = false,
}: ButtonProps) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variantClasses: Record<string, string> = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-900",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} px-4 py-2 ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default function JoinClassPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);
  const [lectureName, setLectureName] = useState("...");
  const [teacherName, setTeacherName] = useState("...");

  useEffect(() => {
    if (!token) {
      setLectureName("Токен олдсонгүй");
      setTeacherName("Токен олдсонгүй");
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      setLectureName(decoded.lectureName || "Хичээлийн нэр олдсонгүй");
      setTeacherName(decoded.teacherName || "Багшийн нэр олдсонгүй");
    } catch (error) {
      setLectureName("Токен буруу байна");
      setTeacherName("Токен буруу байна");
      console.error("JWT decode error:", error);
    }
  }, [token]);

  const handleJoinClass = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert("Хичээлд амжилттай нэгдлээ!");
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card className="w-full">
        <CardHeader className="space-y-4 text-center">
          <CardTitle className="text-xl">Хичээлд нэгдэх</CardTitle>
          <CardDescription>
            Доорх хичээлд нэгдэхийн тулд товчийг дарна уу
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Teacher Info */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-sm text-gray-600">Багш</div>
              <div className="font-semibold text-gray-900">{teacherName}</div>
            </div>
          </div>

          {/* Lecture Info */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Calendar className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-sm text-gray-600">Хичээлийн нэр</div>
              <div className="font-semibold text-gray-900">{lectureName}</div>
            </div>
          </div>

          {/* Join Button */}
          <Button
            onClick={handleJoinClass}
            className="w-full h-12 text-lg font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Нэгдэж байна...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Хичээлд нэгдэх</span>
              </div>
            )}
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Хичээлд нэгдсний дараа та бүх материал болон гэрийн даалгаварт
              хандах боломжтой болно
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
