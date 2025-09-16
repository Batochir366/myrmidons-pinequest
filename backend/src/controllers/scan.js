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

  return res.json({ ok: true, token, message: "QR код хүчинтэй" });
};
