let latestData = {
  weight: 9.76,
  timestamp: new Date().toISOString(),
  clientCode: 'CLI3U0KM7I1',
  scaleCode: 'BSCWSBNSJBD'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    try {
      const data = req.body;
      console.log('📥 ESP32 data received:', data);
      
      latestData = {
        weight: parseFloat(data.weight) || latestData.weight,
        timestamp: new Date().toISOString(),
        clientCode: data.clientCode || latestData.clientCode,
        scaleCode: data.scaleCode || latestData.scaleCode,
        version: data.version || '1.0',
        received_at: new Date().toISOString()
      };
      
      return res.status(200).json({
        success: true,
        message: 'Datos recibidos correctamente',
        data: latestData
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Método no permitido' });
}

export { latestData };
