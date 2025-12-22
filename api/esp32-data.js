// Variable global para almacenar datos del ESP32
if (!global.latestESP32Data) {
  global.latestESP32Data = null;
  console.log('🔥 [ESP32-DATA] Variable global inicializada');
}

export default function handler(req, res) {
  // CORS
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
      
      console.log('🔥 [ESP32-DATA] ===== DATOS RECIBIDOS =====');
      console.log('🔥 [ESP32-DATA] Peso recibido:', data.weight, 'kg');
      console.log('🔥 [ESP32-DATA] Cliente:', data.clientCode);
      console.log('🔥 [ESP32-DATA] Báscula:', data.scaleCode);
      console.log('🔥 [ESP32-DATA] Timestamp:', timestamp);
      
      // Verificar datos básicos
      if (!data.weight || !data.clientCode || !data.scaleCode) {
        console.error('❌ [ESP32-DATA] DATOS INCOMPLETOS');
        return res.status(400).json({
          success: false,
          error: 'Datos incompletos'
        });
      }
      
      // Verificar credenciales
      if (data.clientCode !== 'CLI3U0KM7I1' || data.scaleCode !== 'BSCWSBNSJBD') {
        console.error('❌ [ESP32-DATA] CREDENCIALES INVÁLIDAS');
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }
      
      // ALMACENAR EN VARIABLE GLOBAL
      const storedData = {
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
      
      global.latestESP32Data = storedData;
      
      console.log('🔥 [ESP32-DATA] ===== ALMACENADO EN GLOBAL =====');
      console.log('🔥 [ESP32-DATA] global.latestESP32Data:', JSON.stringify(global.latestESP32Data, null, 2));
      console.log('🔥 [ESP32-DATA] Peso almacenado:', global.latestESP32Data.weight, 'kg');
      console.log('🔥 [ESP32-DATA] Variable global existe:', !!global.latestESP32Data);
      
      // RESPUESTA EXITOSA
      return res.status(200).json({
        success: true,
        message: 'Datos recibidos correctamente',
        data: storedData,
        debug: {
          stored_weight: global.latestESP32Data.weight,
          timestamp: timestamp,
          global_variable_exists: !!global.latestESP32Data
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
