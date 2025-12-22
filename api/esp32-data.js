// Variable global para almacenar los últimos datos del ESP32
if (!global.latestESP32Data) {
  global.latestESP32Data = null;
}

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
      const timestamp = new Date().toISOString();
      
      console.log('📡 [ESP32-DATA] Datos recibidos del ESP32:', data);
      console.log('📡 [ESP32-DATA] Peso recibido:', data.weight, 'kg');
      
      // Verificar que tenemos los datos necesarios
      if (!data.weight || !data.clientCode || !data.scaleCode) {
        console.error('❌ [ESP32-DATA] Datos incompletos:', data);
        return res.status(400).json({
          success: false,
          error: 'Datos incompletos'
        });
      }
      
      // Verificar autenticación
      if (data.clientCode !== 'CLI3U0KM7I1' || data.scaleCode !== 'BSCWSBNSJBD') {
        console.error('❌ [ESP32-DATA] Credenciales inválidas');
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }
      
      // ALMACENAR DATOS REALES DEL ESP32 EN VARIABLE GLOBAL
      global.latestESP32Data = {
        weight: parseFloat(data.weight),
        timestamp: timestamp,
        clientCode: data.clientCode,
        scaleCode: data.scaleCode,
        version: data.version || 'unknown',
        received_at: timestamp,
        wifi_rssi: data.wifi_rssi || null,
        uptime_ms: data.uptime_ms || null,
        free_heap: data.free_heap || null
      };
      
      console.log('✅ [ESP32-DATA] Datos almacenados globalmente:', global.latestESP32Data);
      console.log('✅ [ESP32-DATA] Peso almacenado:', global.latestESP32Data.weight, 'kg');
      
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
      console.error('❌ [ESP32-DATA] Error procesando datos:', error);
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
