const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Proxy endpoint: maneja GET, POST, PUT, DELETE, etc.
app.all('/', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Falta el parámetro ?url');

  try {
    // Preparar opciones para la petición
    const options = {
      method: req.method,
      headers: { ...req.headers, host: undefined, origin: undefined },
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined
    };
    if (!options.body) delete options.body;

    const response = await fetch(targetUrl, options);

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