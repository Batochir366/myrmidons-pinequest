import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

type RequireAuthProps = {
  children: ReactNode;
};

export const RequireAuth = ({ children }: RequireAuthProps) => {
  const router = useRouter();

  useEffect(() => {
    const teacherId = localStorage.getItem("teacherId");
    if (!teacherId) {
      router.replace("/login");
    }
  }, []);

  return <>{children}</>;
};
