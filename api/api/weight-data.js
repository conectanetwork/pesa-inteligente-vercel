import { latestData } from './esp32-data.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    try {
      const { clientCode, scaleCode } = req.query;
      
      if (clientCode !== 'CLI3U0KM7I1' || scaleCode !== 'BSCWSBNSJBD') {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      const config = { empty_weight: 5.0, full_weight: 15.0 };
      const netWeight = Math.max(0, latestData.weight - config.empty_weight);
      const gasPercentage = Math.min(100, Math.max(0, (netWeight / (config.full_weight - config.empty_weight)) * 100));
      
      const current = {
        weight: latestData.weight,
        net_weight: parseFloat(netWeight.toFixed(2)),
        gas_percentage: parseFloat(gasPercentage.toFixed(1)),
        timestamp: latestData.timestamp,
        empty_weight: config.empty_weight,
        full_weight: config.full_weight
      };
      
      const historical = [];
      const now = Date.now();
      for (let i = 23; i >= 0; i--) {
        const timestamp = now - (i * 60 * 60 * 1000);
        const variation = (Math.random() - 0.5) * 0.1;
        const weight = Math.max(0, latestData.weight + variation);
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
          current,
          historical,
          vercelStatus: {
            connected: true,
            currentWeight: latestData.weight,
            lastUpdate: latestData.timestamp,
            server: 'Vercel'
          }
        }
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Método no permitido' });
}
