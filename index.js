const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Proxy endpoint: maneja GET, POST, PUT, etc.
 * Reenvía correctamente body en urlencoded, JSON, o texto plano.
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
        // Recibe como objeto, envía como formdata string
        body = new URLSearchParams(req.body).toString();
      } else if (req.is('application/json')) {
        body = JSON.stringify(req.body);
      } else if (typeof req.body === 'string') {
        body = req.body;
      }
    }

    // Realizar fetch al destino
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
  console.log(`Proxy CORS actualizado activo en puerto ${PORT}`);
});
