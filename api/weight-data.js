// Almacenamiento global para datos del ESP32
global.latestESP32Data = global.latestESP32Data || null;
global.currentConfig = global.currentConfig || {
  empty_weight: 5.0,
  full_weight: 15.0,
  client_code: "CLI3U0KM7I1",
  scale_code: "BSCWSBNSJBD"
};

export default function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Obtener configuración desde parámetros URL
    const { empty_weight, full_weight, client_code, scale_code } = req.query;
    
    // Actualizar configuración si se proporcionan parámetros
    if (empty_weight && full_weight) {
      global.currentConfig = {
        empty_weight: parseFloat(empty_weight),
        full_weight: parseFloat(full_weight),
        client_code: client_code || global.currentConfig.client_code,
        scale_code: scale_code || global.currentConfig.scale_code
      };
    }

    // Verificar si hay datos del ESP32
    const hasESP32Data = global.latestESP32Data && 
                        global.latestESP32Data.weight !== undefined &&
                        (Date.now() - global.latestESP32Data.received_at) < 60000; // Datos de menos de 1 minuto

    let totalWeight, netWeight, gasPercentage;
    let dataSource = "sin_datos";
    let lastUpdate = null;

    if (hasESP32Data) {
      // USAR DATOS REALES DEL ESP32
      totalWeight = global.latestESP32Data.weight;
      dataSource = "esp32_real";
      lastUpdate = new Date(global.latestESP32Data.received_at).toISOString();
      
      console.log(`[weight-data] Usando datos REALES del ESP32: ${totalWeight} kg`);
    } else {
      // USAR DATOS SIMULADOS (para pruebas)
      totalWeight = 9.85 + (Math.random() * 0.3); // Simular variación
      dataSource = "simulado";
      lastUpdate = new Date().toISOString();
      
      console.log(`[weight-data] Usando datos SIMULADOS: ${totalWeight} kg (no hay datos del ESP32)`);
    }

    // Calcular peso neto y porcentaje de gas
    netWeight = Math.max(0, totalWeight - global.currentConfig.empty_weight);
    const maxGas = global.currentConfig.full_weight - global.currentConfig.empty_weight;
    gasPercentage = Math.min(100, Math.max(0, (netWeight / maxGas) * 100));

    const response = {
      success: true,
      data: {
        total_weight: parseFloat(totalWeight.toFixed(3)),
        net_weight: parseFloat(netWeight.toFixed(3)),
        gas_percentage: parseFloat(gasPercentage.toFixed(1)),
        empty_weight: global.currentConfig.empty_weight,
        full_weight: global.currentConfig.full_weight,
        max_gas: parseFloat(maxGas.toFixed(3)),
        client_code: global.currentConfig.client_code,
        scale_code: global.currentConfig.scale_code,
        data_source: dataSource,
        last_update: lastUpdate,
        esp32_connected: hasESP32Data,
        timestamp: new Date().toISOString()
      },
      config: global.currentConfig,
      esp32_status: {
        connected: hasESP32Data,
        last_data: global.latestESP32Data ? new Date(global.latestESP32Data.received_at).toISOString() : null,
        data_age_seconds: global.latestESP32Data ? Math.floor((Date.now() - global.latestESP32Data.received_at) / 1000) : null
      },
      debug: {
        has_esp32_data: hasESP32Data,
        esp32_weight: global.latestESP32Data ? global.latestESP32Data.weight : null,
        calculation: `${totalWeight.toFixed(3)} - ${global.currentConfig.empty_weight} = ${netWeight.toFixed(3)} kg (${gasPercentage.toFixed(1)}%)`
      }
    };

    console.log(`[weight-data] Respuesta:`, JSON.stringify(response, null, 2));
    
    return res.status(200).json(response);

  } catch (error) {
    console.error('[weight-data] Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
}
