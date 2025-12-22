export default function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    try {
      const { clientCode, scaleCode } = req.query;
      
      // Verificar autenticación
      if (clientCode !== 'CLI3U0KM7I1' || scaleCode !== 'BSCWSBNSJBD') {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }
      
      // Datos simulados basados en ESP32 real (9.76 kg)
      const currentWeight = 9.76 + (Math.sin(Date.now() / 60000) * 0.02) + ((Math.random() - 0.5) * 0.01);
      
      // Configuración
      const config = {
        empty_weight: 5.0,
        full_weight: 15.0
      };
      
      // Calcular datos derivados
      const netWeight = Math.max(0, currentWeight - config.empty_weight);
      const gasPercentage = Math.min(100, Math.max(0, 
        (netWeight / (config.full_weight - config.empty_weight)) * 100
      ));
      
      // Datos actuales
      const currentData = {
        weight: parseFloat(currentWeight.toFixed(3)),
        net_weight: parseFloat(netWeight.toFixed(2)),
        gas_percentage: parseFloat(gasPercentage.toFixed(1)),
        timestamp: new Date().toISOString(),
        empty_weight: config.empty_weight,
        full_weight: config.full_weight
      };
      
      // Generar datos históricos
      const historical = [];
      const now = Date.now();
      
      for (let i = 23; i >= 0; i--) {
        const timestamp = now - (i * 60 * 60 * 1000);
        const variation = Math.sin((timestamp / 1000 / 3600) * Math.PI / 12) * 0.05 + (Math.random() - 0.5) * 0.02;
        const weight = Math.max(0, 9.76 + variation);
        const net = Math.max(0, weight - config.empty_weight);
        const gas = Math.min(100, Math.max(0, (net / (config.full_weight - config.empty_weight)) * 100));
        
        historical.push({
          timestamp: new Date(timestamp).toISOString(),
          weight: parseFloat(weight.toFixed(2)),
          net_weight: parseFloat(net.toFixed(2)),
          gas_percentage: parseFloat(gas.toFixed(1))
        });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          current: currentData,
          historical: historical,
          vercelStatus: {
            active: true,
            connected: true,
            isFresh: true,
            currentWeight: currentData.weight,
            expectedNetWeight: netWeight,
            gasPercentage: gasPercentage,
            lastUpdate: new Date().toISOString(),
            protocol: 'VERCEL-API',
            server: 'Vercel',
            method: 'Servidor Externo',
            cost: '$0 USD'
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo datos:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  return res.status(405).json({ 
    error: 'Método no permitido. Use GET.' 
  });
}
