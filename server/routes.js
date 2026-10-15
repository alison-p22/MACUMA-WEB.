const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('./db');
const { generateToken, authenticateToken, requireRole } = require('./auth');

// Helper to calculate Colombian academic scale (Aprobación mínima: 3.4)
function getDesempeno(nota) {
  if (nota >= 4.6) return { escala: 'Superior', color: 'emerald', badge: 'bg-emerald-100 text-emerald-800' };
  if (nota >= 4.0) return { escala: 'Alto', color: 'blue', badge: 'bg-blue-100 text-blue-800' };
  if (nota >= 3.4) return { escala: 'Básico', color: 'amber', badge: 'bg-amber-100 text-amber-800' };
  return { escala: 'Bajo', color: 'rose', badge: 'bg-rose-100 text-rose-800' };
}

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Ingrese usuario y contraseña' });
  }

  // Find user by username or document
  const user = db.findOne('usuarios', (u) => u.username === username || u.documento === username);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Usuario o documento no encontrado' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
  }

  const token = generateToken(user);

  // Set HTTP-only cookie
  res.cookie('macuma_token', token, {
    httpOnly: true,
    secure: false, // development / local
    maxAge: 12 * 60 * 60 * 1000 // 12 hours
  });

  const { password: _, ...userSafe } = user;
  res.json({
    success: true,
    message: 'Inicio de sesión exitoso',
    token,
    user: userSafe
  });
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie('macuma_token');
  res.json({ success: true, message: 'Sesión finalizada correctamente' });
});

router.get('/auth/me', authenticateToken, (req, res) => {
  const { password: _, ...userSafe } = req.currentUser;
  res.json({
    success: true,
    user: userSafe
  });
});

router.get('/colegio', (req, res) => {
  res.json({ success: true, data: db.data.colegio });
});

// -------------------------------------------------------------
// STUDENT PORTAL ROUTES
// -------------------------------------------------------------
router.get('/estudiante/boletin', authenticateToken, (req, res) => {
  // If user is student, can only view their own; if teacher/coordinator, can pass ?estudianteId=
  let targetStudentId = req.currentUser.id;
  if (['profesor', 'coordinador'].includes(req.currentUser.role) && req.query.estudianteId) {
    targetStudentId = req.query.estudianteId;
  }

  const estudiante = db.findOne('usuarios', (u) => u.id === targetStudentId);
  if (!estudiante) {
    return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
  }

  const materias = db.get('materias');
  const allCalificaciones = db.find('calificaciones', (c) => c.estudianteId === targetStudentId);
  const anotaciones = db.find('anotacionesObservador', (a) => a.estudianteId === targetStudentId);
  const situaciones = db.find('situacionesConvivencia', (s) => s.estudianteId === targetStudentId);
  const reportes = db.find('personasReportadas', (r) => r.estudianteId === targetStudentId);

  // Process subjects and grades across periods 1 to 4
  const asignaturasBoletin = materias.map((mat) => {
    const gradesForSubject = allCalificaciones.filter((c) => c.materiaId === mat.id);
    const docente = db.findOne('usuarios', (u) => u.id === mat.docenteId);

    const periodos = {};
    let sumDefinitivas = 0;
    let periodosConNota = 0;

    for (let p = 1; p <= 4; p++) {
      const notaP = gradesForSubject.find((g) => g.periodo === p);
      if (notaP) {
        periodos[p] = {
          cognitivo: notaP.cognitivo,
          procedimental: notaP.procedimental,
          actitudinal: notaP.actitudinal,
          definitiva: notaP.definitiva,
          desempeno: getDesempeno(notaP.definitiva),
          observaciones: notaP.observaciones || ''
        };
        sumDefinitivas += notaP.definitiva;
        periodosConNota++;
      } else {
        periodos[p] = null;
      }
    }

    const definitivaAnual = periodosConNota > 0 ? Number((sumDefinitivas / periodosConNota).toFixed(1)) : 0;

    return {
      id: mat.id,
      nombre: mat.nombre,
      area: mat.area,
      intensidad: mat.intensidad,
      docenteNombre: docente ? docente.nombre : 'Por asignar',
      periodos,
      definitivaAnual,
      desempenoAnual: getDesempeno(definitivaAnual),
      enRiesgo: definitivaAnual < 3.4 && periodosConNota > 0
    };
  });

  // Calculate Period Averages and General Average
  const promediosPorPeriodo = {};
  for (let p = 1; p <= 4; p++) {
    let sumPeriodo = 0;
    let countPeriodo = 0;
    asignaturasBoletin.forEach((asig) => {
      if (asig.periodos[p]) {
        sumPeriodo += asig.periodos[p].definitiva;
        countPeriodo++;
      }
    });
    promediosPorPeriodo[p] = countPeriodo > 0 ? Number((sumPeriodo / countPeriodo).toFixed(2)) : null;
  }

  // General cumulative GPA
  const materiasConNotaAnual = asignaturasBoletin.filter((a) => a.definitivaAnual > 0);
  const promedioGeneral = materiasConNotaAnual.length > 0
    ? Number((materiasConNotaAnual.reduce((acc, curr) => acc + curr.definitivaAnual, 0) / materiasConNotaAnual.length).toFixed(2))
    : 0;

  const totalMaterias = asignaturasBoletin.length;
  const materiasAprobadas = asignaturasBoletin.filter((a) => a.definitivaAnual >= 3.4).length;
  const materiasReprobadas = asignaturasBoletin.filter((a) => a.definitivaAnual > 0 && a.definitivaAnual < 3.4).length;

  // Group ranking calculation
  const compañeros = db.find('usuarios', (u) => u.role === 'estudiante' && u.grupo === estudiante.grupo);
  const rankingList = compañeros.map((comp) => {
    const notasComp = db.find('calificaciones', (c) => c.estudianteId === comp.id);
    let sumNotas = 0;
    let countNotas = 0;
    materias.forEach((mat) => {
      const notasMat = notasComp.filter((c) => c.materiaId === mat.id);
      if (notasMat.length > 0) {
        const promMat = notasMat.reduce((a, b) => a + b.definitiva, 0) / notasMat.length;
        sumNotas += promMat;
        countNotas++;
      }
    });
    const prom = countNotas > 0 ? Number((sumNotas / countNotas).toFixed(2)) : 0;
    return { estudianteId: comp.id, promedio: prom };
  });

  rankingList.sort((a, b) => b.promedio - a.promedio);
  const puestoEnGrupo = rankingList.findIndex((r) => r.estudianteId === estudiante.id) + 1;

  res.json({
    success: true,
    data: {
      estudiante,
      colegio: db.data.colegio,
      asignaturas: asignaturasBoletin,
      promediosPorPeriodo,
      promedioGeneral,
      desempenoGeneral: getDesempeno(promedioGeneral),
      puestoEnGrupo: puestoEnGrupo > 0 ? puestoEnGrupo : 1,
      totalEstudiantesGrupo: compañeros.length,
      estadisticas: {
        totalMaterias,
        materiasAprobadas,
        materiasReprobadas
      },
      anotaciones,
      situaciones,
      reportes
    }
  });
});

router.get('/estudiante/anotaciones', authenticateToken, (req, res) => {
  const estudianteId = req.currentUser.role === 'estudiante' ? req.currentUser.id : req.query.estudianteId;
  const anotaciones = db.find('anotacionesObservador', (a) => a.estudianteId === estudianteId);
  res.json({ success: true, data: anotaciones });
});

router.get('/estudiante/situaciones', authenticateToken, (req, res) => {
  const estudianteId = req.currentUser.role === 'estudiante' ? req.currentUser.id : req.query.estudianteId;
  const situaciones = db.find('situacionesConvivencia', (s) => s.estudianteId === estudianteId);
  res.json({ success: true, data: situaciones });
});

router.get('/estudiante/reportes', authenticateToken, (req, res) => {
  const estudianteId = req.currentUser.role === 'estudiante' ? req.currentUser.id : req.query.estudianteId;
  const reportes = db.find('personasReportadas', (r) => r.estudianteId === estudianteId);
  res.json({ success: true, data: reportes });
});

// -------------------------------------------------------------
// TEACHER PORTAL ROUTES
// -------------------------------------------------------------

// Get courses and subjects for current teacher
router.get('/profesor/mis-cursos', authenticateToken, requireRole(['profesor', 'coordinador']), (req, res) => {
  const isCoord = req.currentUser.role === 'coordinador';
  const materias = db.get('materias');
  const todosEstudiantes = db.find('usuarios', (u) => u.role === 'estudiante');

  // If coordinator, sees all; if teacher, sees assigned
  const misMaterias = isCoord
    ? materias
    : materias.filter((m) => req.currentUser.materias && req.currentUser.materias.includes(m.id));

  // Extract unique groups
  const grupos = [...new Set(todosEstudiantes.map((e) => e.grupo))].sort();

  res.json({
    success: true,
    data: {
      materias: misMaterias,
      grupos
    }
  });
});

// Get grade sheet for a group and subject
router.get('/profesor/sabana-notas', authenticateToken, requireRole(['profesor', 'coordinador']), (req, res) => {
  const { grupo, materiaId, periodo } = req.query;

  if (!grupo || !materiaId) {
    return res.status(400).json({ success: false, message: 'Especifique grupo y materia' });
  }

  const targetPeriodo = Number(periodo) || 1;
  const estudiantes = db.find('usuarios', (u) => u.role === 'estudiante' && u.grupo === grupo);
  const materia = db.findOne('materias', (m) => m.id === materiaId);

  const estudiantesNotas = estudiantes.map((est) => {
    const cal = db.findOne('calificaciones', (c) => c.estudianteId === est.id && c.materiaId === materiaId && c.periodo === targetPeriodo);
    const reporte = db.findOne('personasReportadas', (r) => r.estudianteId === est.id && r.materiaId === materiaId && r.periodo === targetPeriodo);

    return {
      estudianteId: est.id,
      nombre: est.nombre,
      codigo: est.codigo,
      documento: est.documento,
      cognitivo: cal ? cal.cognitivo : null,
      procedimental: cal ? cal.procedimental : null,
      actitudinal: cal ? cal.actitudinal : null,
      definitiva: cal ? cal.definitiva : null,
      desempeno: cal ? getDesempeno(cal.definitiva) : null,
      observaciones: cal ? cal.observaciones : '',
      reportado: !!reporte,
      reporteId: reporte ? reporte.id : null,
      planMejoramiento: reporte ? reporte.planMejoramiento : null
    };
  });

  res.json({
    success: true,
    data: {
      grupo,
      materia,
      periodo: targetPeriodo,
      estudiantes: estudiantesNotas
    }
  });
});

// Save or update grade (single or bulk)
router.post('/profesor/guardar-notas', authenticateToken, requireRole(['profesor', 'coordinador']), (req, res) => {
  const { materiaId, periodo, notas } = req.body;

  if (!materiaId || !periodo || !Array.isArray(notas)) {
    return res.status(400).json({ success: false, message: 'Datos incompletos para guardar notas' });
  }

  const pNum = Number(periodo);
  const savedGrades = [];

  notas.forEach((item) => {
    const { estudianteId, cognitivo, procedimental, actitudinal, observaciones } = item;

    if (cognitivo !== null && procedimental !== null && actitudinal !== null &&
        cognitivo !== undefined && procedimental !== undefined && actitudinal !== undefined &&
        cognitivo !== '' && procedimental !== '' && actitudinal !== '') {

      const cog = Math.min(5.0, Math.max(1.0, Number(cognitivo)));
      const proc = Math.min(5.0, Math.max(1.0, Number(procedimental)));
      const act = Math.min(5.0, Math.max(1.0, Number(actitudinal)));
      const definitiva = Number((cog * 0.4 + proc * 0.4 + act * 0.2).toFixed(1));

      const existing = db.findOne('calificaciones', (c) => c.estudianteId === estudianteId && c.materiaId === materiaId && c.periodo === pNum);

      if (existing) {
        db.update('calificaciones', (c) => c.id === existing.id, {
          cognitivo: cog,
          procedimental: proc,
          actitudinal: act,
          definitiva,
          observaciones: observaciones || '',
          docenteActualizo: req.currentUser.nombre,
          fechaActualizacion: new Date().toISOString()
        });
        savedGrades.push({ estudianteId, definitiva });
      } else {
        const newGrade = {
          id: 'cal-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          estudianteId,
          materiaId,
          periodo: pNum,
          cognitivo: cog,
          procedimental: proc,
          actitudinal: act,
          definitiva,
          observaciones: observaciones || '',
          docenteActualizo: req.currentUser.nombre,
          fechaActualizacion: new Date().toISOString()
        };
        db.insert('calificaciones', newGrade);
        savedGrades.push({ estudianteId, definitiva });
      }

      // Automatically sync reported student list: if definitive is failing (< 3.4), verify/suggest report
      const estObj = db.findOne('usuarios', (u) => u.id === estudianteId);
      const matObj = db.findOne('materias', (m) => m.id === materiaId);
      const repExistente = db.findOne('personasReportadas', (r) => r.estudianteId === estudianteId && r.materiaId === materiaId && r.periodo === pNum);

      if (definitiva < 3.4 && !repExistente && estObj && matObj) {
        db.insert('personasReportadas', {
          id: 'rep-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          estudianteId,
          estudianteNombre: estObj.nombre,
          grado: estObj.grupo,
          materiaId,
          materiaNombre: matObj.nombre,
          docenteId: req.currentUser.id,
          docenteNombre: req.currentUser.nombre,
          periodo: pNum,
          notaActual: definitiva,
          motivo: 'Bajo rendimiento académico en el periodo (' + definitiva + ' < 3.4)',
          planMejoramiento: 'Pendiente de asignación por el docente de la asignatura.',
          fechaLimite: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estado: 'Reportado',
          notificadoAcudiente: false
        });
      } else if (repExistente && definitiva >= 3.4) {
        // Automatically mark as Superado if note improves above 3.4
        db.update('personasReportadas', (r) => r.id === repExistente.id, {
          notaActual: definitiva,
          estado: 'Superado'
        });
      }
    }
  });

  res.json({
    success: true,
    message: `Se actualizaron ${savedGrades.length} calificaciones exitosamente`,
    data: savedGrades
  });
});

// -------------------------------------------------------------
// OBSERVER ANNOTATIONS (ANOTACIONES DEL OBSERVADOR)
// -------------------------------------------------------------
router.get('/anotaciones', authenticateToken, (req, res) => {
  const { estudianteId, grupo } = req.query;
  let anotaciones = db.get('anotacionesObservador');

  if (estudianteId) {
    anotaciones = anotaciones.filter((a) => a.estudianteId === estudianteId);
  } else if (grupo) {
    const estudiantesGrupo = db.find('usuarios', (u) => u.grupo === grupo).map((e) => e.id);
    anotaciones = anotaciones.filter((a) => estudiantesGrupo.includes(a.estudianteId));
  }

  // Attach student metadata
  const enriched = anotaciones.map((anot) => {
    const est = db.findOne('usuarios', (u) => u.id === anot.estudianteId);
    return {
      ...anot,
      estudianteNombre: est ? est.nombre : 'Desconocido',
      estudianteGrupo: est ? est.grupo : 'N/A'
    };
  });

  res.json({ success: true, data: enriched.reverse() });
});

router.post('/anotaciones', authenticateToken, requireRole(['profesor', 'coordinador']), (req, res) => {
  const { estudianteId, materia, tipo, titulo, descripcion, compromiso, descargoEstudiante } = req.body;

  if (!estudianteId || !tipo || !titulo || !descripcion) {
    return res.status(400).json({ success: false, message: 'Complete todos los campos obligatorios' });
  }

  const est = db.findOne('usuarios', (u) => u.id === estudianteId);
  if (!est) {
    return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
  }

  const newAnotacion = {
    id: 'anot-' + Date.now(),
    estudianteId,
    docenteId: req.currentUser.id,
    docenteNombre: req.currentUser.nombre,
    materia: materia || 'Comportamiento General',
    fecha: new Date().toISOString().split('T')[0],
    tipo,
    titulo,
    descripcion,
    descargoEstudiante: descargoEstudiante || 'Pendiente de registrar por el estudiante.',
    compromiso: compromiso || 'Cumplir con las pautas del Manual de Convivencia Institucional.',
    estado: 'En Seguimiento'
  };

  db.insert('anotacionesObservador', newAnotacion);

  res.json({
    success: true,
    message: 'Anotación registrada exitosamente en el observador del estudiante',
    data: newAnotacion
  });
});

// -------------------------------------------------------------
// SITUACIONES DE CONVIVENCIA (LEY 1620)
// -------------------------------------------------------------
router.get('/situaciones', authenticateToken, (req, res) => {
  const { estudianteId, grupo, estado } = req.query;
  let situaciones = db.get('situacionesConvivencia');

  if (estudianteId) {
    situaciones = situaciones.filter((s) => s.estudianteId === estudianteId);
  } else if (grupo) {
    situaciones = situaciones.filter((s) => s.grado === grupo);
  }

  if (estado) {
    situaciones = situaciones.filter((s) => s.estado === estado);
  }

  res.json({ success: true, data: situaciones.reverse() });
});

router.post('/situaciones', authenticateToken, requireRole(['profesor', 'coordinador']), (req, res) => {
  const { estudianteId, tipo, descripcion, accionesPedagogicas, acudienteCitado, fechaCitacion } = req.body;

  if (!estudianteId || !tipo || !descripcion) {
    return res.status(400).json({ success: false, message: 'Complete los campos obligatorios de la situación' });
  }

  const est = db.findOne('usuarios', (u) => u.id === estudianteId);
  if (!est) {
    return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
  }

  const newSituacion = {
    id: 'sit-' + Date.now(),
    estudianteId,
    estudianteNombre: est.nombre,
    grado: est.grupo,
    docenteId: req.currentUser.id,
    docenteNombre: req.currentUser.nombre,
    fecha: new Date().toISOString().split('T')[0],
    tipo, // Tipo I, Tipo II, Tipo III
    descripcion,
    accionesPedagogicas: accionesPedagogicas || 'Diálogo reflexivo y compromiso formativo.',
    acudienteCitado: Boolean(acudienteCitado),
    fechaCitacion: fechaCitacion || null,
    estado: 'Abierta',
    resolucion: null
  };

  db.insert('situacionesConvivencia', newSituacion);

  res.json({
    success: true,
    message: `Situación (${tipo}) registrada con éxito en el comité escolar`,
    data: newSituacion
  });
});

router.put('/situaciones/:id', authenticateToken, requireRole(['profesor', 'coordinador']), (req, res) => {
  const { id } = req.params;
  const { estado, resolucion } = req.body;

  const sit = db.findOne('situacionesConvivencia', (s) => s.id === id);
  if (!sit) {
    return res.status(404).json({ success: false, message: 'Situación no encontrada' });
  }

  const updated = db.update('situacionesConvivencia', (s) => s.id === id, {
    estado: estado || sit.estado,
    resolucion: resolucion !== undefined ? resolucion : sit.resolucion
  });

  res.json({
    success: true,
    message: 'Situación actualizada exitosamente',
    data: updated
  });
});

// -------------------------------------------------------------
// PERSONAS REPORTADAS POR MATERIA (ALERTAS ACADÉMICAS)
// -------------------------------------------------------------
router.get('/reportes-materia', authenticateToken, (req, res) => {
  const { materiaId, grupo, periodo, estado } = req.query;
  let reportes = db.get('personasReportadas');

  if (materiaId) {
    reportes = reportes.filter((r) => r.materiaId === materiaId);
  }
  if (grupo) {
    reportes = reportes.filter((r) => r.grado === grupo);
  }
  if (periodo) {
    reportes = reportes.filter((r) => r.periodo === Number(periodo));
  }
  if (estado) {
    reportes = reportes.filter((r) => r.estado === estado);
  }

  res.json({ success: true, data: reportes.reverse() });
});

router.post('/reportes-materia', authenticateToken, requireRole(['profesor', 'coordinador']), (req, res) => {
  const { estudianteId, materiaId, periodo, notaActual, motivo, planMejoramiento, fechaLimite } = req.body;

  if (!estudianteId || !materiaId || !periodo || !motivo) {
    return res.status(400).json({ success: false, message: 'Campos requeridos incompletos' });
  }

  const est = db.findOne('usuarios', (u) => u.id === estudianteId);
  const mat = db.findOne('materias', (m) => m.id === materiaId);

  if (!est || !mat) {
    return res.status(404).json({ success: false, message: 'Estudiante o Materia no encontrada' });
  }

  const newReporte = {
    id: 'rep-' + Date.now(),
    estudianteId,
    estudianteNombre: est.nombre,
    grado: est.grupo,
    materiaId,
    materiaNombre: mat.nombre,
    docenteId: req.currentUser.id,
    docenteNombre: req.currentUser.nombre,
    periodo: Number(periodo),
    notaActual: Number(notaActual) || 2.5,
    motivo,
    planMejoramiento: planMejoramiento || 'Actividades pedagógicas de refuerzo y nivelación según plan de área.',
    fechaLimite: fechaLimite || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estado: 'Reportado',
    notificadoAcudiente: true
  };

  db.insert('personasReportadas', newReporte);

  res.json({
    success: true,
    message: 'Reporte académico registrado exitosamente',
    data: newReporte
  });
});

router.put('/reportes-materia/:id', authenticateToken, requireRole(['profesor', 'coordinador']), (req, res) => {
  const { id } = req.params;
  const { estado, planMejoramiento, fechaLimite, notaActual } = req.body;

  const rep = db.findOne('personasReportadas', (r) => r.id === id);
  if (!rep) {
    return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
  }

  const updated = db.update('personasReportadas', (r) => r.id === id, {
    estado: estado || rep.estado,
    planMejoramiento: planMejoramiento || rep.planMejoramiento,
    fechaLimite: fechaLimite || rep.fechaLimite,
    notaActual: notaActual !== undefined ? Number(notaActual) : rep.notaActual
  });

  res.json({
    success: true,
    message: 'Reporte académico actualizado correctamente',
    data: updated
  });
});

// -------------------------------------------------------------
// LISTING HELPERS (ESTUDIANTES & MATERIAS)
// -------------------------------------------------------------
router.get('/estudiantes-list', authenticateToken, (req, res) => {
  const { grupo } = req.query;
  let estudiantes = db.find('usuarios', (u) => u.role === 'estudiante');
  if (grupo) {
    estudiantes = estudiantes.filter((e) => e.grupo === grupo);
  }
  const cleanList = estudiantes.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    codigo: e.codigo,
    documento: e.documento,
    grado: e.grado,
    grupo: e.grupo,
    email: e.email,
    acudiente: e.acudiente,
    contactoAcudiente: e.contactoAcudiente
  }));
  res.json({ success: true, data: cleanList });
});

router.get('/materias-list', authenticateToken, (req, res) => {
  res.json({ success: true, data: db.get('materias') });
});

module.exports = router;
