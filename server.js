const express = require('express');
const stRoutes = require('./routes/index');

const port = 5000;

const app = express();
app.use(express.json());

app.listen(port, () => {
  console.log(`express listening on http://localhost:${port}`);
});

app.use(stRoutes);