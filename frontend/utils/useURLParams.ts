import { useState, useEffect } from "react";

export const useURLParams = () => {
  const [params, setParams] = useState({
    token: null as string | null,
    expiresAt: null as number | null,
    attendanceId: null as string | null,
    isInvalid: false,
    paramsLoaded: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sp = new URLSearchParams(window.location.search);
    const tokenValue = sp.get("token");
    const expiresAtValue = sp.get("expiresAt");
    const attendanceIdValue = sp.get("attendanceId");
    const now = Date.now();

    const isInvalid =
      !tokenValue ||
      !expiresAtValue ||
      now > Number(expiresAtValue) ||
      !attendanceIdValue;

    setParams({
      token: tokenValue,
      expiresAt: expiresAtValue ? Number(expiresAtValue) : null,
      attendanceId: attendanceIdValue,
      isInvalid,
      paramsLoaded: true,
    });
  }, []);

  return params;
};
