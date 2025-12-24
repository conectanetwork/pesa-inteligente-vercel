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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Obtener configuración desde parámetros URL
    const { empty_weight = 5, full_weight = 15 } = req.query;
    const emptyWeight = parseFloat(empty_weight);
    const fullWeight = parseFloat(full_weight);

    // Verificar si hay datos del ESP32
    const hasESP32Data = global.latestESP32Data && 
                        global.latestESP32Data.weight !== undefined &&
                        (Date.now() - global.latestESP32Data.received_at) < 60000;

    let totalWeight, dataSource;
    
    if (hasESP32Data) {
      totalWeight = global.latestESP32Data.weight;
      dataSource = "esp32_real";
      console.log(`[weight-test] ✅ Usando datos REALES del ESP32: ${totalWeight} kg`);
    } else {
      totalWeight = 10.085; // Simular el peso actual del ESP32
      dataSource = "simulado";
      console.log(`[weight-test] ⚠️ Usando datos SIMULADOS: ${totalWeight} kg`);
    }

    // Calcular peso neto y porcentaje
    const netWeight = Math.max(0, totalWeight - emptyWeight);
    const maxGas = fullWeight - emptyWeight;
    const gasPercentage = Math.min(100, Math.max(0, (netWeight / maxGas) * 100));

    const response = {
      success: true,
      message: "API de prueba funcionando correctamente",
      data: {
        total_weight: parseFloat(totalWeight.toFixed(3)),
        net_weight: parseFloat(netWeight.toFixed(3)),
        gas_percentage: parseFloat(gasPercentage.toFixed(1)),
        empty_weight: emptyWeight,
        full_weight: fullWeight,
        max_gas: parseFloat(maxGas.toFixed(3)),
        data_source: dataSource,
        esp32_connected: hasESP32Data,
        last_update: new Date().toISOString(),
        timestamp: new Date().toISOString()
      },
      esp32_status: {
        connected: hasESP32Data,
        last_data: global.latestESP32Data ? new Date(global.latestESP32Data.received_at).toISOString() : null,
        raw_data: global.latestESP32Data
      },
      debug: {
        has_esp32_data: hasESP32Data,
        esp32_weight: global.latestESP32Data ? global.latestESP32Data.weight : null,
        calculation: `${totalWeight.toFixed(3)} - ${emptyWeight} = ${netWeight.toFixed(3)} kg (${gasPercentage.toFixed(1)}%)`,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`[weight-test] Respuesta enviada:`, JSON.stringify(response, null, 2));
    
    return res.status(200).json(response);

  } catch (error) {
    console.error('[weight-test] Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
