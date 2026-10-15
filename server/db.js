const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'data', 'database.json');

// Helper to ensure data directory exists
function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) return;
  fs.mkdirSync(dirname, { recursive: true });
}

// Generate seeded initial data
function createInitialData() {
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('123456', salt);

  const usuarios = [
    // Coordinador
    {
      id: 'coord-1',
      username: 'coordinador',
      password: defaultPasswordHash,
      role: 'coordinador',
      nombre: 'Prof. Esperanza Manrique',
      cargo: 'Coordinadora Académica y de Convivencia',
      email: 'coordinacion@mariacurrea.edu.co',
      telefono: '310 456 7890',
      documento: '51987654'
    },
    // Docentes
    {
      id: 'doc-1',
      username: 'docente1',
      password: defaultPasswordHash,
      role: 'profesor',
      nombre: 'Carlos Alberto Morales',
      cargo: 'Docente de Matemáticas y Física',
      email: 'carlos.morales@mariacurrea.edu.co',
      telefono: '315 234 5678',
      documento: '79845123',
      gradosAsignados: ['1001', '1002', '1101'],
      materias: ['mat', 'fis']
    },
    {
      id: 'doc-2',
      username: 'docente2',
      password: defaultPasswordHash,
      role: 'profesor',
      nombre: 'Sandra Patricia Gómez',
      cargo: 'Docente de Lengua Castellana e Inglés',
      email: 'sandra.gomez@mariacurrea.edu.co',
      telefono: '312 987 6543',
      documento: '52341987',
      gradosAsignados: ['1001', '1002', '1101'],
      materias: ['esp', 'ing']
    },
    {
      id: 'doc-3',
      username: 'docente3',
      password: defaultPasswordHash,
      role: 'profesor',
      nombre: 'Javier Méndez Castro',
      cargo: 'Docente de Ciencias Sociales y Filosofía',
      email: 'javier.mendez@mariacurrea.edu.co',
      telefono: '318 654 1230',
      documento: '80123987',
      gradosAsignados: ['1001', '1002', '1101'],
      materias: ['soc', 'fil']
    },
    {
      id: 'doc-4',
      username: 'docente4',
      password: defaultPasswordHash,
      role: 'profesor',
      nombre: 'Diana Marcela Rodríguez',
      cargo: 'Docente de Tecnología y Ed. Física',
      email: 'diana.rodriguez@mariacurrea.edu.co',
      telefono: '314 321 7895',
      documento: '52987123',
      gradosAsignados: ['1001', '1002', '1101'],
      materias: ['tec', 'edufis']
    },
    // Estudiantes Grado 1001
    {
      id: 'est-1',
      username: 'estudiante1',
      password: defaultPasswordHash,
      role: 'estudiante',
      nombre: 'Santiago David Gómez Rincón',
      codigo: 'EST-2026-1001',
      documento: '1023456789',
      grado: '10°',
      grupo: '1001',
      jornada: 'Mañana',
      anoLectivo: '2026',
      acudiente: 'Marta Rincón (Madre)',
      contactoAcudiente: '311 222 3344',
      email: 'santiago.gomez@estudiante.mariacurrea.edu.co'
    },
    {
      id: 'est-2',
      username: 'estudiante2',
      password: defaultPasswordHash,
      role: 'estudiante',
      nombre: 'Valentina Restrepo Pardo',
      codigo: 'EST-2026-1002',
      documento: '1024567890',
      grado: '10°',
      grupo: '1001',
      jornada: 'Mañana',
      anoLectivo: '2026',
      acudiente: 'Julio Restrepo (Padre)',
      contactoAcudiente: '312 333 4455',
      email: 'valentina.restrepo@estudiante.mariacurrea.edu.co'
    },
    {
      id: 'est-3',
      username: 'estudiante3',
      password: defaultPasswordHash,
      role: 'estudiante',
      nombre: 'Mateo Alejandro Torres Silva',
      codigo: 'EST-2026-1003',
      documento: '1025678901',
      grado: '10°',
      grupo: '1001',
      jornada: 'Mañana',
      anoLectivo: '2026',
      acudiente: 'Laura Silva (Madre)',
      contactoAcudiente: '313 444 5566',
      email: 'mateo.torres@estudiante.mariacurrea.edu.co'
    },
    {
      id: 'est-4',
      username: 'estudiante4',
      password: defaultPasswordHash,
      role: 'estudiante',
      nombre: 'Mariana Sofia Castillo Vega',
      codigo: 'EST-2026-1004',
      documento: '1026789012',
      grado: '10°',
      grupo: '1001',
      jornada: 'Mañana',
      anoLectivo: '2026',
      acudiente: 'Diana Vega (Madre)',
      contactoAcudiente: '314 555 6677',
      email: 'mariana.castillo@estudiante.mariacurrea.edu.co'
    },
    {
      id: 'est-5',
      username: 'estudiante5',
      password: defaultPasswordHash,
      role: 'estudiante',
      nombre: 'Andrés Felipe Morales Peña',
      codigo: 'EST-2026-1005',
      documento: '1027890123',
      grado: '10°',
      grupo: '1001',
      jornada: 'Mañana',
      anoLectivo: '2026',
      acudiente: 'Camilo Morales (Padre)',
      contactoAcudiente: '315 666 7788',
      email: 'andres.morales@estudiante.mariacurrea.edu.co'
    },
    // Estudiantes Grado 1002
    {
      id: 'est-6',
      username: 'estudiante6',
      password: defaultPasswordHash,
      role: 'estudiante',
      nombre: 'Isabella Juliana Vargas Ortiz',
      codigo: 'EST-2026-1006',
      documento: '1028901234',
      grado: '10°',
      grupo: '1002',
      jornada: 'Mañana',
      anoLectivo: '2026',
      acudiente: 'Lorena Ortiz (Madre)',
      contactoAcudiente: '316 777 8899',
      email: 'isabella.vargas@estudiante.mariacurrea.edu.co'
    },
    // Estudiante Grado 1101
    {
      id: 'est-7',
      username: 'estudiante7',
      password: defaultPasswordHash,
      role: 'estudiante',
      nombre: 'Juan Camilo Beltrán Rojas',
      codigo: 'EST-2026-1101',
      documento: '1029012345',
      grado: '11°',
      grupo: '1101',
      jornada: 'Mañana',
      anoLectivo: '2026',
      acudiente: 'Patricia Rojas (Madre)',
      contactoAcudiente: '317 888 9900',
      email: 'juan.beltran@estudiante.mariacurrea.edu.co'
    }
  ];

  const materias = [
    { id: 'mat', nombre: 'Matemáticas y Cálculo', docenteId: 'doc-1', intensidad: 4, area: 'Ciencias Exactas' },
    { id: 'fis', nombre: 'Física Clásica y Moderna', docenteId: 'doc-1', intensidad: 3, area: 'Ciencias Naturales' },
    { id: 'esp', nombre: 'Lengua Castellana y Literatura', docenteId: 'doc-2', intensidad: 4, area: 'Humanidades' },
    { id: 'ing', nombre: 'Inglés Avanzado', docenteId: 'doc-2', intensidad: 3, area: 'Idiomas Extranjeros' },
    { id: 'soc', nombre: 'Ciencias Sociales e Historia', docenteId: 'doc-3', intensidad: 3, area: 'Ciencias Sociales' },
    { id: 'fil', nombre: 'Filosofía y Pensamiento Crítico', docenteId: 'doc-3', intensidad: 2, area: 'Humanidades' },
    { id: 'tec', nombre: 'Tecnología e Informática', docenteId: 'doc-4', intensidad: 2, area: 'Tecnología' },
    { id: 'edufis', nombre: 'Educación Física y Deportes', docenteId: 'doc-4', intensidad: 2, area: 'Educación Física' }
  ];

  // Helper to compute weighted average
  function computePeriodAverage(cog, proc, act) {
    return Number((cog * 0.4 + proc * 0.4 + act * 0.2).toFixed(1));
  }

  // Pre-seed grades for students
  const calificaciones = [
    // Santiago Gómez (est-1) - Good student, slight struggle in physics
    { id: 'cal-1', estudianteId: 'est-1', materiaId: 'mat', periodo: 1, cognitivo: 4.4, procedimental: 4.5, actitudinal: 5.0, definitiva: computePeriodAverage(4.4, 4.5, 5.0), observaciones: 'Comprensión sólida de funciones y álgebra.' },
    { id: 'cal-2', estudianteId: 'est-1', materiaId: 'mat', periodo: 2, cognitivo: 4.2, procedimental: 4.3, actitudinal: 4.8, definitiva: computePeriodAverage(4.2, 4.3, 4.8), observaciones: 'Buen trabajo en trigonometría.' },
    { id: 'cal-3', estudianteId: 'est-1', materiaId: 'mat', periodo: 3, cognitivo: 4.6, procedimental: 4.7, actitudinal: 5.0, definitiva: computePeriodAverage(4.6, 4.7, 5.0), observaciones: 'Excelente compromiso y participación.' },
    { id: 'cal-4', estudianteId: 'est-1', materiaId: 'mat', periodo: 4, cognitivo: 4.5, procedimental: 4.4, actitudinal: 4.9, definitiva: computePeriodAverage(4.5, 4.4, 4.9), observaciones: 'Cierre de periodo sobresaliente.' },

    { id: 'cal-5', estudianteId: 'est-1', materiaId: 'fis', periodo: 1, cognitivo: 2.8, procedimental: 2.9, actitudinal: 4.0, definitiva: computePeriodAverage(2.8, 2.9, 4.0), observaciones: 'Dificultad en cinemática vectorial.' },
    { id: 'cal-6', estudianteId: 'est-1', materiaId: 'fis', periodo: 2, cognitivo: 3.5, procedimental: 3.6, actitudinal: 4.5, definitiva: computePeriodAverage(3.5, 3.6, 4.5), observaciones: 'Superó los talleres de recuperación.' },
    { id: 'cal-7', estudianteId: 'est-1', materiaId: 'fis', periodo: 3, cognitivo: 3.8, procedimental: 4.0, actitudinal: 4.6, definitiva: computePeriodAverage(3.8, 4.0, 4.6), observaciones: 'Mejora notoria en laboratorios.' },
    { id: 'cal-8', estudianteId: 'est-1', materiaId: 'fis', periodo: 4, cognitivo: 4.0, procedimental: 4.2, actitudinal: 4.7, definitiva: computePeriodAverage(4.0, 4.2, 4.7), observaciones: 'Consolidó los aprendizajes del año.' },

    { id: 'cal-9', estudianteId: 'est-1', materiaId: 'esp', periodo: 1, cognitivo: 4.8, procedimental: 4.9, actitudinal: 5.0, definitiva: computePeriodAverage(4.8, 4.9, 5.0), observaciones: 'Excelente habilidad en ensayo y lectura crítica.' },
    { id: 'cal-10', estudianteId: 'est-1', materiaId: 'esp', periodo: 2, cognitivo: 4.7, procedimental: 4.8, actitudinal: 5.0, definitiva: computePeriodAverage(4.7, 4.8, 5.0), observaciones: 'Gran participación en el club de debate escolar.' },
    { id: 'cal-11', estudianteId: 'est-1', materiaId: 'esp', periodo: 3, cognitivo: 4.9, procedimental: 5.0, actitudinal: 5.0, definitiva: computePeriodAverage(4.9, 5.0, 5.0), observaciones: 'Liderazgo en presentación literaria.' },
    { id: 'cal-12', estudianteId: 'est-1', materiaId: 'esp', periodo: 4, cognitivo: 4.8, procedimental: 4.9, actitudinal: 5.0, definitiva: computePeriodAverage(4.8, 4.9, 5.0), observaciones: 'Desempeño superior en producción escrita.' },

    { id: 'cal-13', estudianteId: 'est-1', materiaId: 'ing', periodo: 1, cognitivo: 4.0, procedimental: 4.1, actitudinal: 4.5, definitiva: computePeriodAverage(4.0, 4.1, 4.5), observaciones: 'Buen manejo de vocabulario y fluidez.' },
    { id: 'cal-14', estudianteId: 'est-1', materiaId: 'ing', periodo: 2, cognitivo: 4.2, procedimental: 4.3, actitudinal: 4.6, definitiva: computePeriodAverage(4.2, 4.3, 4.6), observaciones: 'Participativo en debates orales.' },
    { id: 'cal-15', estudianteId: 'est-1', materiaId: 'ing', periodo: 3, cognitivo: 4.3, procedimental: 4.4, actitudinal: 4.8, definitiva: computePeriodAverage(4.3, 4.4, 4.8), observaciones: 'Presentaciones orales muy bien estructuradas.' },
    { id: 'cal-16', estudianteId: 'est-1', materiaId: 'ing', periodo: 4, cognitivo: 4.5, procedimental: 4.5, actitudinal: 4.9, definitiva: computePeriodAverage(4.5, 4.5, 4.9), observaciones: 'Excelente nivel B1 alcanzado.' },

    { id: 'cal-17', estudianteId: 'est-1', materiaId: 'soc', periodo: 1, cognitivo: 4.3, procedimental: 4.5, actitudinal: 4.8, definitiva: computePeriodAverage(4.3, 4.5, 4.8), observaciones: 'Análisis crítico de procesos históricos contemporáneos.' },
    { id: 'cal-18', estudianteId: 'est-1', materiaId: 'soc', periodo: 2, cognitivo: 4.5, procedimental: 4.6, actitudinal: 4.9, definitiva: computePeriodAverage(4.5, 4.6, 4.9), observaciones: 'Aporte reflexivo sobre derechos humanos.' },
    { id: 'cal-19', estudianteId: 'est-1', materiaId: 'soc', periodo: 3, cognitivo: 4.4, procedimental: 4.5, actitudinal: 4.8, definitiva: computePeriodAverage(4.4, 4.5, 4.8), observaciones: 'Buen desempeño en cátedra de paz.' },
    { id: 'cal-20', estudianteId: 'est-1', materiaId: 'soc', periodo: 4, cognitivo: 4.6, procedimental: 4.7, actitudinal: 5.0, definitiva: computePeriodAverage(4.6, 4.7, 5.0), observaciones: 'Excelente sustentación del proyecto de ciudadanía.' },

    { id: 'cal-21', estudianteId: 'est-1', materiaId: 'fil', periodo: 1, cognitivo: 4.2, procedimental: 4.3, actitudinal: 4.7, definitiva: computePeriodAverage(4.2, 4.3, 4.7), observaciones: 'Reflexión filosófica profunda.' },
    { id: 'cal-22', estudianteId: 'est-1', materiaId: 'fil', periodo: 2, cognitivo: 4.4, procedimental: 4.5, actitudinal: 4.8, definitiva: computePeriodAverage(4.4, 4.5, 4.8), observaciones: 'Argumentación lógica coherente.' },
    { id: 'cal-23', estudianteId: 'est-1', materiaId: 'fil', periodo: 3, cognitivo: 4.3, procedimental: 4.4, actitudinal: 4.7, definitiva: computePeriodAverage(4.3, 4.4, 4.7), observaciones: 'Compromiso constante con las lecturas.' },
    { id: 'cal-24', estudianteId: 'est-1', materiaId: 'fil', periodo: 4, cognitivo: 4.5, procedimental: 4.6, actitudinal: 4.9, definitiva: computePeriodAverage(4.5, 4.6, 4.9), observaciones: 'Excelente desempeño analítico.' },

    { id: 'cal-25', estudianteId: 'est-1', materiaId: 'tec', periodo: 1, cognitivo: 4.7, procedimental: 4.8, actitudinal: 5.0, definitiva: computePeriodAverage(4.7, 4.8, 5.0), observaciones: 'Habilidades sobresalientes en lógica de programación.' },
    { id: 'cal-26', estudianteId: 'est-1', materiaId: 'tec', periodo: 2, cognitivo: 4.8, procedimental: 4.9, actitudinal: 5.0, definitiva: computePeriodAverage(4.8, 4.9, 5.0), observaciones: 'Creación destacada de proyectos web.' },
    { id: 'cal-27', estudianteId: 'est-1', materiaId: 'tec', periodo: 3, cognitivo: 4.9, procedimental: 5.0, actitudinal: 5.0, definitiva: computePeriodAverage(4.9, 5.0, 5.0), observaciones: 'Iniciativa y tutoría a compañeros de clase.' },
    { id: 'cal-28', estudianteId: 'est-1', materiaId: 'tec', periodo: 4, cognitivo: 5.0, procedimental: 5.0, actitudinal: 5.0, definitiva: computePeriodAverage(5.0, 5.0, 5.0), observaciones: 'Proyecto tecnológico de alta calidad.' },

    { id: 'cal-29', estudianteId: 'est-1', materiaId: 'edufis', periodo: 1, cognitivo: 4.5, procedimental: 4.6, actitudinal: 4.8, definitiva: computePeriodAverage(4.5, 4.6, 4.8), observaciones: 'Buena condición física y trabajo en equipo.' },
    { id: 'cal-30', estudianteId: 'est-1', materiaId: 'edufis', periodo: 2, cognitivo: 4.6, procedimental: 4.7, actitudinal: 4.9, definitiva: computePeriodAverage(4.6, 4.7, 4.9), observaciones: 'Destacada participación en intercolegiados.' },
    { id: 'cal-31', estudianteId: 'est-1', materiaId: 'edufis', periodo: 3, cognitivo: 4.6, procedimental: 4.7, actitudinal: 4.9, definitiva: computePeriodAverage(4.6, 4.7, 4.9), observaciones: 'Comportamiento deportivo ejemplar.' },
    { id: 'cal-32', estudianteId: 'est-1', materiaId: 'edufis', periodo: 4, cognitivo: 4.8, procedimental: 4.9, actitudinal: 5.0, definitiva: computePeriodAverage(4.8, 4.9, 5.0), observaciones: 'Excelente disciplina deportiva.' },

    // Valentina Restrepo (est-2) - High achiever
    { id: 'cal-33', estudianteId: 'est-2', materiaId: 'mat', periodo: 1, cognitivo: 4.9, procedimental: 5.0, actitudinal: 5.0, definitiva: computePeriodAverage(4.9, 5.0, 5.0), observaciones: 'Puntaje perfecto en olimpiada interna.' },
    { id: 'cal-34', estudianteId: 'est-2', materiaId: 'mat', periodo: 2, cognitivo: 4.8, procedimental: 4.9, actitudinal: 5.0, definitiva: computePeriodAverage(4.8, 4.9, 5.0), observaciones: 'Excelente razonamiento lógico.' },
    { id: 'cal-35', estudianteId: 'est-2', materiaId: 'fis', periodo: 1, cognitivo: 4.7, procedimental: 4.8, actitudinal: 5.0, definitiva: computePeriodAverage(4.7, 4.8, 5.0), observaciones: 'Gran rigor experimental.' },
    { id: 'cal-36', estudianteId: 'est-2', materiaId: 'esp', periodo: 1, cognitivo: 4.9, procedimental: 5.0, actitudinal: 5.0, definitiva: computePeriodAverage(4.9, 5.0, 5.0), observaciones: 'Redacción y oratoria impecables.' },

    // Mateo Torres (est-3) - Struggling student with pending alerts in Math & Physics
    { id: 'cal-37', estudianteId: 'est-3', materiaId: 'mat', periodo: 1, cognitivo: 2.3, procedimental: 2.5, actitudinal: 3.2, definitiva: computePeriodAverage(2.3, 2.5, 3.2), observaciones: 'No presenta talleres ni actividades semanales.' },
    { id: 'cal-38', estudianteId: 'est-3', materiaId: 'mat', periodo: 2, cognitivo: 2.6, procedimental: 2.7, actitudinal: 3.5, definitiva: computePeriodAverage(2.6, 2.7, 3.5), observaciones: 'Reprobó la evaluación semestral.' },
    { id: 'cal-39', estudianteId: 'est-3', materiaId: 'fis', periodo: 1, cognitivo: 2.1, procedimental: 2.4, actitudinal: 3.0, definitiva: computePeriodAverage(2.1, 2.4, 3.0), observaciones: 'Inasistencias a prácticas de laboratorio.' },
    { id: 'cal-40', estudianteId: 'est-3', materiaId: 'fis', periodo: 2, cognitivo: 2.4, procedimental: 2.6, actitudinal: 3.2, definitiva: computePeriodAverage(2.4, 2.6, 3.2), observaciones: 'Continúa en riesgo de reprobación.' },
    { id: 'cal-41', estudianteId: 'est-3', materiaId: 'esp', periodo: 1, cognitivo: 3.3, procedimental: 3.4, actitudinal: 3.8, definitiva: computePeriodAverage(3.3, 3.4, 3.8), observaciones: 'Básico. Requiere reforzar lectura comprensiva.' },

    // Mariana Castillo (est-4)
    { id: 'cal-42', estudianteId: 'est-4', materiaId: 'mat', periodo: 1, cognitivo: 3.8, procedimental: 3.9, actitudinal: 4.5, definitiva: computePeriodAverage(3.8, 3.9, 4.5), observaciones: 'Desempeño satisfactorio.' },
    { id: 'cal-43', estudianteId: 'est-4', materiaId: 'fis', periodo: 1, cognitivo: 3.7, procedimental: 3.8, actitudinal: 4.4, definitiva: computePeriodAverage(3.7, 3.8, 4.4), observaciones: 'Buena comprensión conceptual.' },

    // Andrés Felipe Morales (est-5) - Has behavioral situation and academic alert in Social Sciences
    { id: 'cal-44', estudianteId: 'est-5', materiaId: 'soc', periodo: 1, cognitivo: 2.5, procedimental: 2.6, actitudinal: 3.0, definitiva: computePeriodAverage(2.5, 2.6, 3.0), observaciones: 'Distracción constante y no entrega de guías.' },
    { id: 'cal-45', estudianteId: 'est-5', materiaId: 'soc', periodo: 2, cognitivo: 2.8, procedimental: 2.9, actitudinal: 3.2, definitiva: computePeriodAverage(2.8, 2.9, 3.2), observaciones: 'Plan de mejoramiento pendiente de sustentación.' },
    { id: 'cal-46', estudianteId: 'est-5', materiaId: 'mat', periodo: 1, cognitivo: 3.5, procedimental: 3.6, actitudinal: 4.0, definitiva: computePeriodAverage(3.5, 3.6, 4.0), observaciones: 'Desempeño básico aceptable.' }
  ];

  // Observador del alumno
  const anotacionesObservador = [
    {
      id: 'anot-1',
      estudianteId: 'est-1',
      docenteId: 'doc-1',
      docenteNombre: 'Carlos Alberto Morales',
      materia: 'Matemáticas',
      fecha: '2026-03-12',
      tipo: 'Felicitación',
      titulo: 'Representación en Olimpiadas Matemáticas',
      descripcion: 'El estudiante Santiago demostró alto compromiso y liderazgo académico al representar a la institución en la ronda zonal de las Olimpiadas Matemáticas de Cundinamarca, obteniendo mención de honor.',
      descargoEstudiante: 'Agradezco el apoyo de la institución y del profesor Carlos para mi preparación.',
      compromiso: 'Continuar fortaleciendo las áreas de análisis algebraico y cálculo.',
      estado: 'Cumplido'
    },
    {
      id: 'anot-2',
      estudianteId: 'est-1',
      docenteId: 'doc-1',
      docenteNombre: 'Carlos Alberto Morales',
      materia: 'Física',
      fecha: '2026-04-20',
      tipo: 'Compromiso Académico',
      titulo: 'Plan de Refuerzo en Cinemática',
      descripcion: 'Se firma compromiso pedagógico con el estudiante para superar dificultades evidenciadas en el tema de vectores y movimiento rectilíneo acelerado durante el primer periodo.',
      descargoEstudiante: 'Reconozco que me costó comprender la formulación vectorial en los primeros laboratorios.',
      compromiso: 'Asistir a las tutorías de los martes de 2:00 pm a 3:30 pm y entregar la guía de nivelación completa.',
      estado: 'Cumplido'
    },
    {
      id: 'anot-3',
      estudianteId: 'est-1',
      docenteId: 'doc-2',
      docenteNombre: 'Sandra Patricia Gómez',
      materia: 'Lengua Castellana',
      fecha: '2026-08-14',
      tipo: 'Felicitación',
      titulo: 'Liderazgo en el Periódico Escolar y Debate',
      descripcion: 'Se exalta la brillante redacción del ensayo editorial para el periódico escolar institucional "Voz Curreísta", demostrando los valores de respeto, autonomía y justicia que caracterizan al colegio.',
      descargoEstudiante: 'Es un honor poder expresar ideas constructivas para la comunidad curreísta.',
      compromiso: 'Seguir motivando a los compañeros a participar activamente en la escritura.',
      estado: 'Cumplido'
    },
    {
      id: 'anot-4',
      estudianteId: 'est-3',
      docenteId: 'doc-1',
      docenteNombre: 'Carlos Alberto Morales',
      materia: 'Matemáticas',
      fecha: '2026-05-18',
      tipo: 'Llamado de Atención',
      titulo: 'Incumplimiento reiterado de evidencias académicas',
      descripcion: 'El estudiante Mateo no presentó las evidencias de las guías 3, 4 y 5 a pesar de los plazos extendidos otorgados por el docente. Se notifica a acudiente.',
      descargoEstudiante: 'Tuve problemas para imprimir las guías y no pedí ayuda a tiempo.',
      compromiso: 'Entregar carpeta completa el día lunes y firmar acta de seguimiento con coordinación.',
      estado: 'En Seguimiento'
    },
    {
      id: 'anot-5',
      estudianteId: 'est-5',
      docenteId: 'doc-3',
      docenteNombre: 'Javier Méndez Castro',
      materia: 'Ciencias Sociales',
      fecha: '2026-06-02',
      tipo: 'Compromiso Convivencial',
      titulo: 'Interrupción reiterada del ambiente de aprendizaje',
      descripcion: 'El estudiante Andrés genera indisciplina recurrente en el aula de clase, interfiriendo con el derecho a la educación de sus compañeros de grupo 1001.',
      descargoEstudiante: 'Pido disculpas al profesor y a mis compañeros por distraer la clase.',
      compromiso: 'Sentarse en las primeras filas, entregar su teléfono móvil al ingresar al aula y guardar respeto.',
      estado: 'En Seguimiento'
    }
  ];

  // Situaciones de Convivencia Escolar (Ley 1620)
  const situacionesConvivencia = [
    {
      id: 'sit-1',
      estudianteId: 'est-5',
      estudianteNombre: 'Andrés Felipe Morales Peña',
      grado: '1001',
      docenteId: 'doc-3',
      docenteNombre: 'Javier Méndez Castro',
      fecha: '2026-06-05',
      tipo: 'Tipo I',
      descripcion: 'Uso indebido de dispositivos electrónicos y burla hacia la intervención de un compañero durante la exposición de Derechos Humanos.',
      accionesPedagogicas: 'Diálogo reflexivo individual, elaboración de un ensayo pedagógico sobre la empatía y respeto en el manual de convivencia.',
      acudienteCitado: true,
      fechaCitacion: '2026-06-10',
      estado: 'Cerrada',
      resolucion: 'El acudiente asistió puntualmente. El estudiante cumplió con la actividad pedagógica restaurativa ante el grupo.'
    },
    {
      id: 'sit-2',
      estudianteId: 'est-3',
      estudianteNombre: 'Mateo Alejandro Torres Silva',
      grado: '1001',
      docenteId: 'doc-1',
      docenteNombre: 'Carlos Alberto Morales',
      fecha: '2026-09-08',
      tipo: 'Tipo I',
      descripcion: 'Llegadas tarde reiteradas a la primera hora de clase (más de 4 ocasiones sin justificación médica o de acudiente).',
      accionesPedagogicas: 'Firma de compromiso de puntualidad en coordinación y comunicación telefónica con la acudiente Laura Silva.',
      acudienteCitado: false,
      fechaCitacion: null,
      estado: 'En mediación',
      resolucion: 'Se monitorea asistencia diaria durante 15 días hábiles.'
    }
  ];

  // Personas Reportadas por Materia (Alertas tempranas y planes de mejoramiento)
  const personasReportadas = [
    {
      id: 'rep-1',
      estudianteId: 'est-3',
      estudianteNombre: 'Mateo Alejandro Torres Silva',
      grado: '1001',
      materiaId: 'mat',
      materiaNombre: 'Matemáticas y Cálculo',
      docenteId: 'doc-1',
      docenteNombre: 'Carlos Alberto Morales',
      periodo: 2,
      notaActual: 2.6,
      motivo: 'Bajo rendimiento conceptual y falta de entrega del 60% de talleres.',
      planMejoramiento: 'Guía integradora de trigonometría (problemas aplicados) y sustentación oral en el tablero.',
      fechaLimite: '2026-10-25',
      estado: 'Reportado',
      notificadoAcudiente: true
    },
    {
      id: 'rep-2',
      estudianteId: 'est-3',
      estudianteNombre: 'Mateo Alejandro Torres Silva',
      grado: '1001',
      materiaId: 'fis',
      materiaNombre: 'Física Clásica y Moderna',
      docenteId: 'doc-1',
      docenteNombre: 'Carlos Alberto Morales',
      periodo: 2,
      notaActual: 2.4,
      motivo: 'No presentó informe de laboratorio ni evaluación de dinámica newtoniana.',
      planMejoramiento: 'Entrega de informe corregido de laboratorio virtual y sustentación escrita.',
      fechaLimite: '2026-10-28',
      estado: 'En Nivelación',
      notificadoAcudiente: true
    },
    {
      id: 'rep-3',
      estudianteId: 'est-5',
      estudianteNombre: 'Andrés Felipe Morales Peña',
      grado: '1001',
      materiaId: 'soc',
      materiaNombre: 'Ciencias Sociales e Historia',
      docenteId: 'doc-3',
      docenteNombre: 'Javier Méndez Castro',
      periodo: 2,
      notaActual: 2.8,
      motivo: 'No sustentó el análisis de la Constitución de 1991.',
      planMejoramiento: 'Cuadro comparativo entre la constitución de 1886 y 1991 con mapa conceptual.',
      fechaLimite: '2026-10-30',
      estado: 'Reportado',
      notificadoAcudiente: true
    }
  ];

  return {
    colegio: {
      nombre: 'I.E.D. MARÍA CURREA MANRIQUE',
      lema: 'Respeto • Justicia • Autonomía (Respect • Justice • Autonomy)',
      resolucion: 'Resolución de Aprobación Oficial No. 1245 de la Secretaría de Educación',
      dane: '111001098765',
      nit: '860.543.210-9',
      direccion: 'Bogotá D.C., Colombia',
      telefono: '(601) 745 8899',
      rector: 'Mg. Roberto Gómez Cadavid',
      escudoUrl: '/assets/escudo.png'
    },
    usuarios,
    materias,
    calificaciones,
    anotacionesObservador,
    situacionesConvivencia,
    personasReportadas
  };
}

// Database helper functions
class Database {
  constructor() {
    this.path = DB_PATH;
    this.data = null;
    this.init();
  }

  init() {
    ensureDirectoryExistence(this.path);
    if (!fs.existsSync(this.path)) {
      console.log('Creando base de datos inicial con semillas colombianas...');
      const initialData = createInitialData();
      fs.writeFileSync(this.path, JSON.stringify(initialData, null, 2), 'utf8');
      this.data = initialData;
    } else {
      try {
        const raw = fs.readFileSync(this.path, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error al leer database.json, regenerando...', err);
        const initialData = createInitialData();
        fs.writeFileSync(this.path, JSON.stringify(initialData, null, 2), 'utf8');
        this.data = initialData;
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('Error guardando database.json:', err);
      return false;
    }
  }

  get(collection) {
    return this.data[collection] || [];
  }

  find(collection, predicate) {
    const list = this.get(collection);
    return list.filter(predicate);
  }

  findOne(collection, predicate) {
    const list = this.get(collection);
    return list.find(predicate) || null;
  }

  insert(collection, item) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    this.data[collection].push(item);
    this.save();
    return item;
  }

  update(collection, predicate, updater) {
    const list = this.get(collection);
    const index = list.findIndex(predicate);
    if (index !== -1) {
      this.data[collection][index] = { ...this.data[collection][index], ...updater };
      this.save();
      return this.data[collection][index];
    }
    return null;
  }

  delete(collection, predicate) {
    const list = this.get(collection);
    const initialLen = list.length;
    this.data[collection] = list.filter((item) => !predicate(item));
    if (this.data[collection].length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
}

module.exports = new Database();
