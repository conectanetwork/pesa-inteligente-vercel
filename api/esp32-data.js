// Almacenamiento global para datos del ESP32
global.latestESP32Data = global.latestESP32Data || null;

export default function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      message: "Endpoint para recibir datos del ESP32",
      method_required: "POST",
      last_data: global.latestESP32Data,
      status: "active"
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Use POST para enviar datos del ESP32.' });
  }

  try {
    const data = req.body;
    
    // Validar datos requeridos
    if (!data || typeof data.weight !== 'number') {
      return res.status(400).json({ 
        success: false, 
        error: 'Datos inválidos. Se requiere peso numérico.' 
      });
    }

    // Almacenar datos del ESP32 con timestamp
    global.latestESP32Data = {
      ...data,
      received_at: Date.now(),
      timestamp: new Date().toISOString()
    };

    console.log(`[esp32-data] ✅ DATOS RECIBIDOS DEL ESP32:`, JSON.stringify(global.latestESP32Data, null, 2));

    // Respuesta exitosa
    const response = {
      success: true,
      message: "Datos recibidos correctamente",
      data: {
        weight: data.weight,
        timestamp: global.latestESP32Data.timestamp,
        clientCode: data.clientCode,
        scaleCode: data.scaleCode,
        version: data.version,
        received_at: global.latestESP32Data.timestamp,
        wifi_rssi: data.wifi_rssi,
        uptime_ms: data.uptime_ms,
        free_heap: data.free_heap
      },
      debug: {
        stored_weight: global.latestESP32Data.weight,
        timestamp: global.latestESP32Data.timestamp
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('[esp32-data] Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
}
