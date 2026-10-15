// Teacher Portal Logic - I.E.D. María Currea Manrique
const API_BASE = (window.location.protocol === 'file:' || !window.location.port) ? 'http://localhost:3000' : '';

function authFetch(url, options = {}) {
  const token = localStorage.getItem('macuma_token');
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(`${API_BASE}${url}`, { ...options, headers });
}

let currentTeacher = null;
let currentCursosData = null;
let currentSabana = null;
let currentStudentsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();
  await initTeacherDashboard();
});

// Initialize teacher portal
async function initTeacherDashboard() {
  try {
    const res = await authFetch('/api/auth/me');
    if (!res.ok) {
      window.location.href = window.location.protocol === 'file:' ? 'index.html' : '/index.html';
      return;
    }

    const data = await res.json();
    if (!data.success || !['profesor', 'coordinador'].includes(data.user.role)) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso Restringido',
        text: 'Este módulo requiere permisos de Docente o Coordinador.',
        confirmButtonColor: '#851426'
      }).then(() => {
        window.location.href = '/index.html';
      });
      return;
    }

    currentTeacher = data.user;
    document.getElementById('navTeacherName').textContent = currentTeacher.nombre;
    document.getElementById('navTeacherCargo').textContent = currentTeacher.cargo || 'Docente Titular';
    document.getElementById('teacherGreeting').textContent = `Bienvenido(a), ${currentTeacher.nombre}`;

    // Load assigned courses and subjects
    await cargarCursosYMaterias();

    // Set today's date for modals
    const today = new Date().toISOString().split('T')[0];
    const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    document.getElementById('repFechaLimiteInput').value = twoWeeks;
    document.getElementById('sitFechaCitacionInput').value = today;

  } catch (err) {
    console.error('Error inicializando docente:', err);
    window.location.href = '/index.html';
  }
}

// Load courses and subjects assigned to this teacher
async function cargarCursosYMaterias() {
  try {
    const res = await authFetch('/api/profesor/mis-cursos');
    const json = await res.json();

    if (json.success) {
      currentCursosData = json.data;

      // Populate Materias select
      const selectMateria = document.getElementById('selectMateria');
      selectMateria.innerHTML = '';
      currentCursosData.materias.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `${m.nombre} (${m.area})`;
        selectMateria.appendChild(opt);
      });

      // Populate Grupos select if needed
      const selectGrupo = document.getElementById('selectGrupo');
      if (currentCursosData.grupos && currentCursosData.grupos.length > 0) {
        selectGrupo.innerHTML = '';
        currentCursosData.grupos.forEach((g) => {
          const opt = document.createElement('option');
          opt.value = g;
          opt.textContent = `Grado ${g} (${g === '1001' ? 'Décimo A' : g === '1002' ? 'Décimo B' : 'Once A'})`;
          selectGrupo.appendChild(opt);
        });
      }

      // Load all students for modals
      await cargarListaEstudiantesParaModales();

      // Trigger initial load of grade sheet
      await cargarSabanaNotas();
    }
  } catch (err) {
    console.error('Error cargando materias:', err);
  }
}

// Load student list for modals
async function cargarListaEstudiantesParaModales() {
  const grupo = document.getElementById('selectGrupo').value;
  try {
    const res = await authFetch(`/api/estudiantes-list?grupo=${grupo}`);
    const json = await res.json();
    if (json.success) {
      currentStudentsList = json.data;
      
      const selects = [
        document.getElementById('anotEstudianteSelect'),
        document.getElementById('sitEstudianteSelect'),
        document.getElementById('repEstudianteSelect')
      ];

      selects.forEach((sel) => {
        if (!sel) return;
        sel.innerHTML = '';
        currentStudentsList.forEach((e) => {
          const opt = document.createElement('option');
          opt.value = e.id;
          opt.textContent = `${e.nombre} (Cód: ${e.codigo})`;
          sel.appendChild(opt);
        });
      });
    }
  } catch (err) {
    console.error('Error cargando lista de estudiantes:', err);
  }
}

// Load Grade Sheet (Planilla)
async function cargarSabanaNotas() {
  const grupo = document.getElementById('selectGrupo').value;
  const materiaId = document.getElementById('selectMateria').value;
  const periodo = document.getElementById('selectPeriodo').value;

  if (!grupo || !materiaId) return;

  // Update modal default subject
  const selMat = document.getElementById('selectMateria');
  if (selMat && selMat.selectedOptions[0]) {
    document.getElementById('anotMateriaInput').value = selMat.selectedOptions[0].textContent.split(' (')[0];
  }

  // Reload student list for modals if group changed
  await cargarListaEstudiantesParaModales();

  const tbody = document.getElementById('planillaTableBody');
  tbody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-slate-400"><i data-lucide="loader" class="w-6 h-6 animate-spin mx-auto mb-2"></i> Cargando planilla de calificaciones...</td></tr>`;
  lucide.createIcons();

  try {
    const res = await authFetch(`/api/profesor/sabana-notas?grupo=${grupo}&materiaId=${materiaId}&periodo=${periodo}`);
    const json = await res.json();

    if (json.success && json.data) {
      currentSabana = json.data;
      renderPlanilla(currentSabana.estudiantes);
      actualizarMetricas(currentSabana.estudiantes);

      // Also refresh reported list, annotations, situations
      cargarReportadosMateria();
      cargarAnotacionesDocente();
      cargarSituacionesDocente();
    }
  } catch (err) {
    console.error('Error al cargar planilla:', err);
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-6 text-rose-500 font-medium">Error al cargar calificaciones</td></tr>`;
  }
}

// Calculate performance scale in frontend (Aprobación mínima: 3.4)
function calcularDesempeno(def) {
  if (def >= 4.6) return { escala: 'Superior', badge: 'badge-superior' };
  if (def >= 4.0) return { escala: 'Alto', badge: 'badge-alto' };
  if (def >= 3.4) return { escala: 'Básico', badge: 'badge-basico' };
  return { escala: 'Bajo', badge: 'badge-bajo' };
}

// Render Grade Sheet
function renderPlanilla(estudiantes) {
  const tbody = document.getElementById('planillaTableBody');
  tbody.innerHTML = '';

  if (estudiantes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-slate-400">No hay estudiantes matriculados en este grupo.</td></tr>`;
    return;
  }

  estudiantes.forEach((est, idx) => {
    const tr = document.createElement('tr');
    tr.id = `row-${est.estudianteId}`;
    tr.className = 'hover:bg-slate-50/80 transition';

    const cogVal = est.cognitivo !== null ? est.cognitivo.toFixed(1) : '';
    const procVal = est.procedimental !== null ? est.procedimental.toFixed(1) : '';
    const actVal = est.actitudinal !== null ? est.actitudinal.toFixed(1) : '';
    const defVal = est.definitiva !== null ? est.definitiva.toFixed(1) : '-';
    
    const escalaObj = est.definitiva !== null ? calcularDesempeno(est.definitiva) : { escala: 'Sin Nota', badge: 'bg-slate-100 text-slate-600' };

    tr.innerHTML = `
      <td class="py-3 px-3 text-center text-xs font-bold text-slate-400">${idx + 1}</td>
      
      <td class="py-3 px-4">
        <div class="font-bold text-slate-900 text-sm">${est.nombre}</div>
        <div class="text-[11px] text-slate-500 flex items-center gap-2">
          <span>Cód: ${est.codigo}</span>
          <span>•</span>
          <span>Doc: ${est.documento}</span>
        </div>
      </td>

      <!-- Cognitivo Input (40%) -->
      <td class="py-3 px-2 text-center">
        <input type="number" step="0.1" min="1.0" max="5.0"
               id="cog-${est.estudianteId}"
               value="${cogVal}"
               oninput="onNotaChange('${est.estudianteId}')"
               placeholder="1.0-5.0"
               class="grade-input w-20 py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800">
      </td>

      <!-- Procedimental Input (40%) -->
      <td class="py-3 px-2 text-center">
        <input type="number" step="0.1" min="1.0" max="5.0"
               id="proc-${est.estudianteId}"
               value="${procVal}"
               oninput="onNotaChange('${est.estudianteId}')"
               placeholder="1.0-5.0"
               class="grade-input w-20 py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800">
      </td>

      <!-- Actitudinal Input (20%) -->
      <td class="py-3 px-2 text-center">
        <input type="number" step="0.1" min="1.0" max="5.0"
               id="act-${est.estudianteId}"
               value="${actVal}"
               oninput="onNotaChange('${est.estudianteId}')"
               placeholder="1.0-5.0"
               class="grade-input w-20 py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800">
      </td>

      <!-- Definitiva (Calculated live) -->
      <td class="py-3 px-2 text-center bg-rose-50/40">
        <span id="def-${est.estudianteId}" class="text-base font-extrabold ${est.definitiva < 3.4 ? 'text-rose-600' : 'text-slate-900'}">
          ${defVal}
        </span>
      </td>

      <!-- Desempeño Badge -->
      <td class="py-3 px-2 text-center">
        <span id="badge-${est.estudianteId}" class="inline-block px-2 py-0.5 rounded-full text-xs font-bold ${escalaObj.badge}">
          ${escalaObj.escala}
        </span>
      </td>

      <!-- Observaciones -->
      <td class="py-3 px-4">
        <input type="text"
               id="obs-${est.estudianteId}"
               value="${est.observaciones || ''}"
               placeholder="Juicio valorativo o recomendación..."
               class="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700">
      </td>

      <!-- Quick Action (Report Button) -->
      <td class="py-3 px-3 text-center">
        <button type="button" onclick="reportarDirecto('${est.estudianteId}', '${est.nombre}')"
                title="Generar Alerta de Mejoramiento"
                class="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition">
          <i data-lucide="alert-triangle" class="w-4 h-4"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  lucide.createIcons();
}

// Real-time calculation when teacher types any grade (Escala de 1.0 a 5.0)
function onNotaChange(estudianteId) {
  const cogInp = document.getElementById(`cog-${estudianteId}`);
  const procInp = document.getElementById(`proc-${estudianteId}`);
  const actInp = document.getElementById(`act-${estudianteId}`);
  const defSpan = document.getElementById(`def-${estudianteId}`);
  const badgeSpan = document.getElementById(`badge-${estudianteId}`);

  // Helper to validate and clamp to 1.0 - 5.0
  const sanitizeGrade = (input) => {
    let val = parseFloat(input.value);
    if (isNaN(val)) return NaN;
    if (val > 5.0) {
      input.value = '5.0';
      val = 5.0;
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'La escala es de 1.0 a 5.0. Se ajustó a la máxima (5.0).',
        showConfirmButton: false,
        timer: 2000
      });
    } else if (val < 1.0 && input.value.trim().length >= 3) {
      input.value = '1.0';
      val = 1.0;
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'La escala es de 1.0 a 5.0. Se ajustó a la mínima (1.0).',
        showConfirmButton: false,
        timer: 2000
      });
    }
    return val;
  };

  const cog = sanitizeGrade(cogInp);
  const proc = sanitizeGrade(procInp);
  const act = sanitizeGrade(actInp);

  if (!isNaN(cog) && !isNaN(proc) && !isNaN(act)) {
    // Escala oficial: Saber (40%) + Hacer (40%) + Ser (20%)
    const definitiva = Number((cog * 0.4 + proc * 0.4 + act * 0.2).toFixed(1));
    defSpan.textContent = definitiva.toFixed(1);

    if (definitiva < 3.4) {
      defSpan.className = 'text-base font-extrabold text-rose-600';
    } else {
      defSpan.className = 'text-base font-extrabold text-slate-900';
    }

    const scale = calcularDesempeno(definitiva);
    badgeSpan.textContent = scale.escala;
    badgeSpan.className = `inline-block px-2 py-0.5 rounded-full text-xs font-bold ${scale.badge}`;
  } else {
    defSpan.textContent = '-';
    badgeSpan.textContent = 'Incompleto';
    badgeSpan.className = 'inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600';
  }

  // Recalculate metrics on the fly
  recalcularMetricasEnVivo();
}

// Live metrics recalculation
function recalcularMetricasEnVivo() {
  if (!currentSabana || !currentSabana.estudiantes) return;

  let totalEst = currentSabana.estudiantes.length;
  let sumDef = 0;
  let countConNota = 0;
  let aprobados = 0;
  let reprobados = 0;

  currentSabana.estudiantes.forEach((est) => {
    const defSpan = document.getElementById(`def-${est.estudianteId}`);
    if (defSpan) {
      const val = parseFloat(defSpan.textContent);
      if (!isNaN(val)) {
        sumDef += val;
        countConNota++;
        if (val >= 3.4) aprobados++;
        else reprobados++;
      }
    }
  });

  const prom = countConNota > 0 ? (sumDef / countConNota).toFixed(1) : '--';
  document.getElementById('metricTotalEstudiantes').textContent = totalEst;
  document.getElementById('metricPromedioGrupo').textContent = prom;
  document.getElementById('metricAprobados').textContent = aprobados;
  document.getElementById('metricReportados').textContent = reprobados;
  document.getElementById('docBadgeReportados').textContent = reprobados;
}

function actualizarMetricas(estudiantes) {
  recalcularMetricasEnVivo();
}

// Bulk Save Grades
async function guardarNotasEnLote() {
  const materiaId = document.getElementById('selectMateria').value;
  const periodo = document.getElementById('selectPeriodo').value;
  const btn = document.getElementById('btnGuardarNotas');

  if (!currentSabana || !currentSabana.estudiantes) return;

  const notasPayload = [];

  currentSabana.estudiantes.forEach((est) => {
    const cogInp = document.getElementById(`cog-${est.estudianteId}`);
    const procInp = document.getElementById(`proc-${est.estudianteId}`);
    const actInp = document.getElementById(`act-${est.estudianteId}`);
    const obsInp = document.getElementById(`obs-${est.estudianteId}`);

    if (cogInp.value !== '' && procInp.value !== '' && actInp.value !== '') {
      notasPayload.push({
        estudianteId: est.estudianteId,
        cognitivo: parseFloat(cogInp.value),
        procedimental: parseFloat(procInp.value),
        actitudinal: parseFloat(actInp.value),
        observaciones: obsInp.value.trim()
      });
    }
  });

  if (notasPayload.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Planilla Vacía',
      text: 'Ingrese notas de al menos un estudiante para guardar.',
      confirmButtonColor: '#851426'
    });
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Guardando...`;
  lucide.createIcons();

  try {
    const res = await authFetch('/api/profesor/guardar-notas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        materiaId,
        periodo: Number(periodo),
        notas: notasPayload
      })
    });

    const json = await res.json();

    if (json.success) {
      Swal.fire({
        icon: 'success',
        title: '¡Calificaciones Guardadas!',
        text: `Se registraron satisfactoriamente ${notasPayload.length} notas en el sistema.`,
        timer: 1800,
        showConfirmButton: false
      });
      // Refresh reported list
      cargarReportadosMateria();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error al Guardar',
        text: json.message || 'No se pudieron almacenar las notas.',
        confirmButtonColor: '#851426'
      });
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Error de Red',
      text: 'No fue posible comunicar con el servidor.',
      confirmButtonColor: '#851426'
    });
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> <span>Guardar Todas las Calificaciones</span>`;
    lucide.createIcons();
  }
}

// -------------------------------------------------------------
// MODULE: PERSONAS REPORTADAS POR MATERIA (ALERTAS)
// -------------------------------------------------------------
async function cargarReportadosMateria() {
  const materiaId = document.getElementById('selectMateria').value;
  const grupo = document.getElementById('selectGrupo').value;
  const periodo = document.getElementById('selectPeriodo').value;

  try {
    const res = await authFetch(`/api/reportes-materia?materiaId=${materiaId}&grupo=${grupo}&periodo=${periodo}`);
    const json = await res.json();

    const container = document.getElementById('contenedorReportados');
    container.innerHTML = '';

    if (!json.success || json.data.length === 0) {
      container.innerHTML = `
        <div class="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <i data-lucide="check-circle-2" class="w-10 h-10 text-emerald-500 mx-auto mb-2"></i>
          <h4 class="font-bold text-slate-800 text-sm">Sin alertas académicas activas</h4>
          <p class="text-xs text-slate-500">Ningún estudiante de este grupo se encuentra en estado de pérdida o reporte en esta asignatura.</p>
        </div>
      `;
      document.getElementById('docBadgeReportados').textContent = '0';
      lucide.createIcons();
      return;
    }

    document.getElementById('docBadgeReportados').textContent = json.data.length;

    json.data.forEach((rep) => {
      const card = document.createElement('div');
      card.className = 'bg-white p-4 rounded-xl border border-rose-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4';

      let statusBadge = rep.estado === 'Superado' ? 'bg-emerald-100 text-emerald-800' : rep.estado === 'En Nivelación' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800';

      card.innerHTML = `
        <div class="space-y-1.5 flex-grow">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${statusBadge}">${rep.estado}</span>
            <span class="text-xs text-slate-400">Grado ${rep.grado} • Periodo ${rep.periodo}</span>
          </div>
          <h4 class="font-bold text-slate-900 text-sm">${rep.estudianteNombre}</h4>
          <p class="text-xs text-slate-600"><strong>Motivo:</strong> ${rep.motivo}</p>
          <div class="bg-rose-50/70 p-2.5 rounded-lg border border-rose-100 text-xs text-slate-800">
            <strong class="text-currea-wine">Plan de Mejoramiento:</strong> ${rep.planMejoramiento}
          </div>
          <div class="text-[11px] text-slate-500 flex gap-4 pt-1">
            <span>Nota: <strong class="text-rose-600">${rep.notaActual.toFixed(1)}</strong></span>
            <span>Fecha Límite: <strong>${rep.fechaLimite}</strong></span>
          </div>
        </div>

        <div class="flex md:flex-col gap-2 shrink-0">
          <button onclick="editarReporte('${rep.id}', '${rep.estado}', '${encodeURIComponent(rep.planMejoramiento)}', '${rep.fechaLimite}', ${rep.notaActual})"
                  class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Actualizar Plan
          </button>
          
          <button onclick="cambiarEstadoReporte('${rep.id}', 'Superado')"
                  class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5 border border-emerald-200">
            <i data-lucide="check" class="w-3.5 h-3.5"></i> Marcar Superado
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    lucide.createIcons();
  } catch (err) {
    console.error('Error cargando reportados:', err);
  }
}

// Direct report shortcut from grade sheet
function reportarDirecto(estudianteId, nombre) {
  document.getElementById('repEstudianteSelect').value = estudianteId;
  const defVal = document.getElementById(`def-${estudianteId}`)?.textContent;
  if (defVal && !isNaN(parseFloat(defVal))) {
    document.getElementById('repNotaInput').value = parseFloat(defVal);
  }
  document.getElementById('repMotivoInput').value = `Bajo rendimiento académico en el periodo (${defVal || '2.5'})`;
  abrirModalNuevoReporte();
}

function abrirModalNuevoReporte() {
  document.getElementById('repIdEdit').value = '';
  document.getElementById('modalReporte').classList.remove('hidden');
}

function editarReporte(id, estado, planEncoded, fechaLimite, nota) {
  document.getElementById('repIdEdit').value = id;
  document.getElementById('repEstadoSelect').value = estado;
  document.getElementById('repPlanInput').value = decodeURIComponent(planEncoded);
  document.getElementById('repFechaLimiteInput').value = fechaLimite;
  document.getElementById('repNotaInput').value = nota;
  document.getElementById('modalReporte').classList.remove('hidden');
}

async function cambiarEstadoReporte(id, nuevoEstado) {
  try {
    const res = await authFetch(`/api/reportes-materia/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (res.ok) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Estado actualizado a ${nuevoEstado}`,
        showConfirmButton: false,
        timer: 1500
      });
      cargarReportadosMateria();
    }
  } catch (e) {
    console.error(e);
  }
}

// Form submit: Create or Edit Report
document.getElementById('formNuevoReporte').addEventListener('submit', async (e) => {
  e.preventDefault();
  const idEdit = document.getElementById('repIdEdit').value;
  const materiaId = document.getElementById('selectMateria').value;
  const periodo = document.getElementById('selectPeriodo').value;
  const estudianteId = document.getElementById('repEstudianteSelect').value;
  const notaActual = parseFloat(document.getElementById('repNotaInput').value);
  const motivo = document.getElementById('repMotivoInput').value.trim();
  const planMejoramiento = document.getElementById('repPlanInput').value.trim();
  const fechaLimite = document.getElementById('repFechaLimiteInput').value;
  const estado = document.getElementById('repEstadoSelect').value;

  try {
    let res;
    if (idEdit) {
      // Edit existing
      res = await authFetch(`/api/reportes-materia/${idEdit}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado, planMejoramiento, fechaLimite, notaActual })
      });
    } else {
      // Create new
      res = await authFetch('/api/reportes-materia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estudianteId,
          materiaId,
          periodo,
          notaActual,
          motivo,
          planMejoramiento,
          fechaLimite
        })
      });
    }

    if (res.ok) {
      cerrarModal('modalReporte');
      Swal.fire({
        icon: 'success',
        title: 'Reporte Académico Guardado',
        text: 'Se actualizó el plan de mejoramiento del estudiante.',
        timer: 1500,
        showConfirmButton: false
      });
      cargarReportadosMateria();
    }
  } catch (err) {
    console.error(err);
  }
});

// -------------------------------------------------------------
// MODULE: OBSERVADOR DEL ALUMNO
// -------------------------------------------------------------
async function cargarAnotacionesDocente() {
  const grupo = document.getElementById('selectGrupo').value;
  try {
    const res = await authFetch(`/api/anotaciones?grupo=${grupo}`);
    const json = await res.json();

    const container = document.getElementById('contenedorAnotacionesDocente');
    container.innerHTML = '';

    if (!json.success || json.data.length === 0) {
      container.innerHTML = `
        <div class="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <i data-lucide="clipboard-pen" class="w-10 h-10 text-slate-300 mx-auto mb-2"></i>
          <h4 class="font-bold text-slate-800 text-sm">Sin anotaciones registradas en este grupo</h4>
          <p class="text-xs text-slate-500">Haga clic en "Nueva Anotación en Observador" para exaltar o hacer seguimiento a un alumno.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    json.data.forEach((anot) => {
      const card = document.createElement('div');
      card.className = 'bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2';

      let badgeColor = anot.tipo === 'Felicitación' ? 'bg-emerald-100 text-emerald-800' : anot.tipo === 'Llamado de Atención' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800';

      card.innerHTML = `
        <div class="flex items-center justify-between border-b pb-2">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${badgeColor}">${anot.tipo}</span>
            <span class="font-bold text-slate-900 text-sm">${anot.estudianteNombre}</span>
            <span class="text-xs text-slate-400">(${anot.estudianteGrupo})</span>
          </div>
          <span class="text-xs text-slate-400">${anot.fecha}</span>
        </div>

        <div>
          <strong class="text-xs text-slate-800">${anot.titulo}</strong>
          <p class="text-xs text-slate-600 mt-1">${anot.descripcion}</p>
        </div>

        ${anot.compromiso ? `
          <div class="bg-amber-50/70 p-2 rounded border border-amber-200 text-xs text-amber-900">
            <strong>Compromiso:</strong> ${anot.compromiso}
          </div>
        ` : ''}

        <div class="flex justify-between items-center text-[10px] text-slate-400 pt-1">
          <span>Registrado por: ${anot.docenteNombre} (${anot.materia})</span>
          <span class="font-bold text-slate-600">Estado: ${anot.estado}</span>
        </div>
      `;
      container.appendChild(card);
    });

    lucide.createIcons();
  } catch (err) {
    console.error('Error cargando anotaciones:', err);
  }
}

function abrirModalNuevaAnotacion() {
  document.getElementById('modalAnotacion').classList.remove('hidden');
}

// Form submit: Create Observation
document.getElementById('formNuevaAnotacion').addEventListener('submit', async (e) => {
  e.preventDefault();
  const estudianteId = document.getElementById('anotEstudianteSelect').value;
  const tipo = document.getElementById('anotTipoSelect').value;
  const materia = document.getElementById('anotMateriaInput').value.trim();
  const titulo = document.getElementById('anotTituloInput').value.trim();
  const descripcion = document.getElementById('anotDescInput').value.trim();
  const compromiso = document.getElementById('anotCompromisoInput').value.trim();

  try {
    const res = await authFetch('/api/anotaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estudianteId, tipo, materia, titulo, descripcion, compromiso })
    });

    if (res.ok) {
      cerrarModal('modalAnotacion');
      Swal.fire({
        icon: 'success',
        title: 'Anotación Registrada',
        text: 'Se ha asentado en el observador oficial del alumno.',
        timer: 1500,
        showConfirmButton: false
      });
      cargarAnotacionesDocente();
    }
  } catch (err) {
    console.error(err);
  }
});

// -------------------------------------------------------------
// MODULE: SITUACIONES DE CONVIVENCIA (LEY 1620)
// -------------------------------------------------------------
async function cargarSituacionesDocente() {
  const grupo = document.getElementById('selectGrupo').value;
  try {
    const res = await authFetch(`/api/situaciones?grupo=${grupo}`);
    const json = await res.json();

    const container = document.getElementById('contenedorSituacionesDocente');
    container.innerHTML = '';

    if (!json.success || json.data.length === 0) {
      container.innerHTML = `
        <div class="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <i data-lucide="scale" class="w-10 h-10 text-slate-300 mx-auto mb-2"></i>
          <h4 class="font-bold text-slate-800 text-sm">Sin situaciones de convivencia reportadas</h4>
          <p class="text-xs text-slate-500">No hay procesos activos en el comité para el grado ${grupo}.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    json.data.forEach((sit) => {
      const card = document.createElement('div');
      card.className = 'bg-white p-4 rounded-xl border border-purple-200 shadow-xs space-y-2';

      card.innerHTML = `
        <div class="flex items-center justify-between border-b pb-2">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">${sit.tipo}</span>
            <span class="font-bold text-slate-900 text-sm">${sit.estudianteNombre}</span>
            <span class="text-xs text-slate-400">(Grado ${sit.grado})</span>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${sit.estado === 'Cerrada' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
            ${sit.estado}
          </span>
        </div>

        <p class="text-xs text-slate-700"><strong>Hechos:</strong> ${sit.descripcion}</p>
        <p class="text-xs text-slate-700"><strong>Acciones Pedagógicas:</strong> ${sit.accionesPedagogicas}</p>

        ${sit.resolucion ? `
          <div class="bg-emerald-50 p-2 rounded text-xs text-emerald-900 border border-emerald-200">
            <strong>Resolución:</strong> ${sit.resolucion}
          </div>
        ` : ''}

        <div class="flex items-center justify-between pt-2 border-t text-[11px] text-slate-500">
          <span>${sit.acudienteCitado ? '✓ Acudiente Citado' : 'Sin citación'} • ${sit.fecha}</span>
          ${sit.estado !== 'Cerrada' ? `
            <button onclick="cerrarSituacionConvivencia('${sit.id}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs">
              Resolver y Cerrar Caso
            </button>
          ` : ''}
        </div>
      `;
      container.appendChild(card);
    });

    lucide.createIcons();
  } catch (err) {
    console.error('Error cargando situaciones:', err);
  }
}

function abrirModalNuevaSituacion() {
  document.getElementById('modalSituacion').classList.remove('hidden');
}

async function cerrarSituacionConvivencia(sitId) {
  const { value: resolucion } = await Swal.fire({
    title: 'Cerrar Caso de Convivencia',
    input: 'textarea',
    inputLabel: 'Detalle la resolución formativa o acuerdo alcanzado con el estudiante y acudiente:',
    inputPlaceholder: 'El estudiante cumplió con la jornada restaurativa y firmó acta de compromiso...',
    showCancelButton: true,
    confirmButtonColor: '#0f172a',
    cancelButtonText: 'Cancelar',
    confirmButtonText: 'Cerrar Situación'
  });

  if (resolucion) {
    try {
      const res = await authFetch(`/api/profesor/situaciones/${sitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'Cerrada', resolucion })
      });
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Situación Cerrada',
          text: 'Se archivó con resolución en el comité de convivencia.',
          timer: 1500,
          showConfirmButton: false
        });
        cargarSituacionesDocente();
      }
    } catch (e) {
      console.error(e);
    }
  }
}

document.getElementById('formNuevaSituacion').addEventListener('submit', async (e) => {
  e.preventDefault();
  const estudianteId = document.getElementById('sitEstudianteSelect').value;
  const tipo = document.getElementById('sitTipoSelect').value;
  const descripcion = document.getElementById('sitDescInput').value.trim();
  const accionesPedagogicas = document.getElementById('sitAccionesInput').value.trim();
  const acudienteCitado = document.getElementById('sitCitacionCheck').checked;
  const fechaCitacion = document.getElementById('sitFechaCitacionInput').value;

  try {
    const res = await authFetch('/api/situaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estudianteId,
        tipo,
        descripcion,
        accionesPedagogicas,
        acudienteCitado,
        fechaCitacion
      })
    });

    if (res.ok) {
      cerrarModal('modalSituacion');
      Swal.fire({
        icon: 'success',
        title: 'Situación Registrada',
        text: 'Se notificó al Comité Escolar de Convivencia.',
        timer: 1500,
        showConfirmButton: false
      });
      cargarSituacionesDocente();
    }
  } catch (err) {
    console.error(err);
  }
});

// Tab Switcher for Teacher
function cambiarPestanaDocente(tabName) {
  const tabs = ['notas', 'reportados', 'observador', 'situaciones'];
  tabs.forEach((t) => {
    const content = document.getElementById(`docTab-${t}`);
    const btn = document.getElementById(`docTabBtn-${t}`);
    if (t === tabName) {
      content.classList.remove('hidden');
      btn.className = 'tab-btn py-3.5 px-3 border-b-2 font-bold text-sm flex items-center gap-2 border-currea-wine text-currea-wine';
    } else {
      content.classList.add('hidden');
      btn.className = 'tab-btn py-3.5 px-3 border-b-2 font-medium text-sm flex items-center gap-2 border-transparent text-slate-500 hover:text-slate-800';
    }
  });
  lucide.createIcons();
}

function cerrarModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

// Demo teacher switcher
async function cambiarDocenteDemo(username) {
  try {
    const res = await authFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: '123456' })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('macuma_user', JSON.stringify(data.user));
      localStorage.setItem('macuma_token', data.token);
      location.reload();
    }
  } catch (e) {
    console.error(e);
  }
}

// Logout
async function logout() {
  await authFetch('/api/auth/logout', { method: 'POST' });
  localStorage.removeItem('macuma_user');
  localStorage.removeItem('macuma_token');
  window.location.href = '/index.html';
}
