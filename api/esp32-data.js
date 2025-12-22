// Variable global para almacenar los últimos datos del ESP32
global.latestESP32Data = global.latestESP32Data || null;

export default function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    try {
      const data = req.body;
      console.log('📡 Datos recibidos del ESP32:', data);
      
      // Verificar que tenemos los datos necesarios
      if (!data.weight || !data.clientCode || !data.scaleCode) {
        return res.status(400).json({
          success: false,
          error: 'Datos incompletos'
        });
      }
      
      // Verificar autenticación
      if (data.clientCode !== 'CLI3U0KM7I1' || data.scaleCode !== 'BSCWSBNSJBD') {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }
      
      // ALMACENAR DATOS REALES DEL ESP32
      global.latestESP32Data = {
        weight: parseFloat(data.weight),
        timestamp: new Date().toISOString(),
        clientCode: data.clientCode,
        scaleCode: data.scaleCode,
        version: data.version || 'unknown',
        received_at: new Date().toISOString()
      };
      
      console.log('✅ Datos del ESP32 almacenados:', global.latestESP32Data);
      
      return res.status(200).json({
        success: true,
        message: 'Datos recibidos correctamente',
        data: global.latestESP32Data
      });
      
    } catch (error) {
      console.error('❌ Error procesando datos del ESP32:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  return res.status(405).json({ 
    error: 'Método no permitido. Use POST para enviar datos del ESP32.' 
  });
}
