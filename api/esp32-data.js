export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    try {
      const data = req.body;
      const timestamp = new Date().toISOString();
      
      console.log('🔥 [ESP32-DATA] Peso recibido:', data.weight, 'kg');
      
      if (!data.weight || !data.clientCode || !data.scaleCode) {
        return res.status(400).json({
          success: false,
          error: 'Datos incompletos'
        });
      }
      
      if (data.clientCode !== 'CLI3U0KM7I1' || data.scaleCode !== 'BSCWSBNSJBD') {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }
      
      // Forzar inicialización
      global.latestESP32Data = {
        weight: parseFloat(data.weight),
        timestamp: timestamp,
        clientCode: data.clientCode,
        scaleCode: data.scaleCode,
        version: data.version || 'unknown',
        received_at: timestamp
      };
      
      console.log('🔥 [ESP32-DATA] ALMACENADO:', global.latestESP32Data.weight, 'kg');
      
      return res.status(200).json({
        success: true,
        message: 'Datos recibidos correctamente',
        data: global.latestESP32Data,
        debug: {
          stored_weight: global.latestESP32Data.weight,
          timestamp: timestamp
        }
      });
      
    } catch (error) {
      console.error('❌ [ESP32-DATA] ERROR:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  return res.status(405).json({ 
    error: 'Método no permitido. Use POST.' 
  });
}
