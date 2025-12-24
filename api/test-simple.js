export default function handler(req, res) {
  return res.json({
    success: true,
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
    test: "OK"
  });
}
