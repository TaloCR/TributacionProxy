app.all('/', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Falta el parámetro ?url');

  try {
    // Preparar headers, filtrar host y origin
    const customHeaders = { ...req.headers };
    delete customHeaders.host;
    delete customHeaders.origin;

    // Detecta tipo de body
    let body = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (req.is('application/x-www-form-urlencoded')) {
        body = new URLSearchParams(req.body).toString();
      } else if (req.is('application/json')) {
        body = JSON.stringify(req.body);
      } else if (typeof req.body === 'string') {
        body = req.body;
      }
      // No modificar si no hay body
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
