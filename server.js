const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const apiRoutes = require('./server/routes');
const db = require('./server/db');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS support (allows local file:// or any origin)
app.use(cors({ origin: true, credentials: true }));

// Body & Cookie Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', apiRoutes);

// Fallback for single page navigation or clean URLs
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/estudiante', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'estudiante.html'));
});

app.get('/profesor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profesor.html'));
});

app.get('/coordinador', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'coordinador.html'));
});

// Default root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('================================================================');
  console.log('   SISTEMA DE GESTIÓN ESCOLAR - I.E.D. MARÍA CURREA MANRIQUE    ');
  console.log('================================================================');
  console.log(` Servidor activo en: http://localhost:${PORT}`);
  console.log(` Portal del Estudiante: http://localhost:${PORT}/estudiante.html`);
  console.log(` Portal del Docente:    http://localhost:${PORT}/profesor.html`);
  console.log('----------------------------------------------------------------');
  console.log(' Cuentas de demostración disponibles:');
  console.log(' 1. Estudiante 1: estudiante1 / 123456 (Santiago Gómez - Grado 1001)');
  console.log(' 2. Estudiante 3: estudiante3 / 123456 (Mateo Torres - Alertas / Riesgo)');
  console.log(' 3. Docente 1:    docente1    / 123456 (Prof. Carlos Morales - Matemáticas)');
  console.log(' 4. Docente 2:    docente2    / 123456 (Profa. Sandra Gómez - Lengua Castellana)');
  console.log(' 5. Coordinador:  coordinador / 123456 (Prof. Esperanza Manrique)');
  console.log('================================================================');
});
