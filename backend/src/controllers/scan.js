export const scanQR = (req, res) => {
  const token = req.query.token;
  const expiresAt = Number(req.query.expiresAt);
  const now = Date.now();

  if (!token || !expiresAt) {
    return res
      .status(400)
      .json({ ok: false, message: "Token эсвэл хугацаа байхгүй" });
  }

  if (now > expiresAt) {
    return res.status(400).json({ ok: false, message: "QR код хүчинтэй биш" });
  }

  // Хэрэглэгч токен зөв байгааг backend-д бүртгэж болно (DB, cache гэх мэт)
  return res.json({ ok: true, token, message: "QR код хүчинтэй" });
};
