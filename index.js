const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post('/token', async (req, res) => {
  try {
    const targetUrl = 'https://idp.comprobanteselectronicos.go.cr/auth/realms/rut/protocol/openid-connect/token';
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', process.env.HACIENDA_USER);
    params.append('password', process.env.HACIENDA_PASS);
    params.append('client_id', 'api-prod');

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }
    res.json(data); // El frontend solo recibe el token
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/**
 * Proxy CORS universal: permite saltar restricciones CORS para otros endpoints.
 * En el frontend, uso: https://tributacionproxy.up.railway.app/?url=https://API_DESTINO
 */
app.all('/', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Falta el parámetro ?url');

  try {
    // Limpiar headers problemáticos
    const customHeaders = { ...req.headers };
    delete customHeaders.host;
    delete customHeaders.origin;

    let body = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (req.is('application/x-www-form-urlencoded')) {
        body = new URLSearchParams(req.body).toString();
      } else if (req.is('application/json')) {
        body = JSON.stringify(req.body);
      } else if (typeof req.body === 'string') {
        body = req.body;
      }
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: customHeaders,
      body,
    });

    res.status(response.status);
    if (response.headers.get('content-type')) {
      res.set('content-type', response.headers.get('content-type'));
    }
    const buf = await response.buffer();
    res.send(buf);
  } catch (err) {
    res.status(502).send('Error en el proxy: ' + err.message);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Proxy CORS activo en puerto ${PORT}`);
});
