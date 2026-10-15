// Student Portal Logic - I.E.D. María Currea Manrique
const API_BASE = (window.location.protocol === 'file:' || !window.location.port) ? 'http://localhost:3000' : '';
let currentBoletinData = null;
let gradesChartInstance = null;
let activePeriodoFilter = 'todos';

document.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();
  await checkAuthAndLoad();
});

// Check authentication and load student data
async function checkAuthAndLoad(estudianteIdOverride = null) {
  try {
    const token = localStorage.getItem('macuma_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const meRes = await fetch(`${API_BASE}/api/auth/me`, { headers });
    if (!meRes.ok) {
      window.location.href = window.location.protocol === 'file:' ? 'index.html' : '/index.html';
      return;
    }

    const meData = await meRes.json();
    const currentUser = meData.user;

    // Determine target student ID
    let targetId = estudianteIdOverride || currentUser.id;
    if (currentUser.role === 'estudiante' && !estudianteIdOverride) {
      targetId = currentUser.id;
    }

    const url = targetId ? `${API_BASE}/api/estudiante/boletin?estudianteId=${targetId}` : `${API_BASE}/api/estudiante/boletin`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error('Error al cargar datos del boletín');
    }

    const json = await res.json();
    if (json.success && json.data) {
      currentBoletinData = json.data;
      renderStudentDashboard(currentBoletinData);
    }
  } catch (err) {
    console.error('Error cargando estudiante:', err);
    Swal.fire({
      icon: 'error',
      title: 'Sesión no válida',
      text: 'Por favor inicie sesión nuevamente.',
      confirmButtonColor: '#851426'
    }).then(() => {
      window.location.href = '/index.html';
    });
  }
}

// Render complete dashboard
function renderStudentDashboard(data) {
  const est = data.estudiante;

  // Header & Profile Banner
  document.getElementById('navStudentName').textContent = est.nombre;
  document.getElementById('navStudentGrade').textContent = `Grado ${est.grupo || '1001'} • ${est.jornada || 'Mañana'}`;

  document.getElementById('studentFullName').textContent = est.nombre;
  document.getElementById('studentCode').textContent = est.codigo || 'EST-2026';
  document.getElementById('studentDoc').textContent = est.documento || 'Sin registrar';
  document.getElementById('studentGroup').textContent = `${est.grado || '10°'} (${est.grupo || '1001'})`;
  document.getElementById('studentJornada').textContent = `${est.jornada || 'Mañana'} • Sede A`;
  document.getElementById('studentAcudiente').textContent = est.acudiente || 'Sin registrar';
  document.getElementById('studentContacto').textContent = est.contactoAcudiente || 'Sin registrar';
  document.getElementById('studentEmail').textContent = est.email || 'correo@mariacurrea.edu.co';

  // Initials
  const nameParts = est.nombre.split(' ');
  const initials = nameParts.length >= 2 ? (nameParts[0][0] + nameParts[1][0]).toUpperCase() : est.nombre.substring(0, 2).toUpperCase();
  document.getElementById('studentInitials').textContent = initials;

  // KPIs
  const prom = data.promedioGeneral;
  document.getElementById('kpiPromedio').textContent = prom.toFixed(1);
  const badgeEl = document.getElementById('kpiDesempenoBadge');
  badgeEl.textContent = `Desempeño ${data.desempenoGeneral.escala}`;
  badgeEl.className = `inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold badge-${data.desempenoGeneral.escala.toLowerCase()}`;

  document.getElementById('kpiPuesto').textContent = data.puestoEnGrupo;
  document.getElementById('kpiTotalGrupo').textContent = `de ${data.totalEstudiantesGrupo} en grupo ${est.grupo}`;

  document.getElementById('kpiAprobadas').textContent = data.estadisticas.materiasAprobadas;
  document.getElementById('kpiReprobadas').textContent = data.estadisticas.materiasReprobadas;
  
  const estadoAcademicoEl = document.getElementById('kpiEstadoAcademico');
  if (data.estadisticas.materiasReprobadas === 0) {
    estadoAcademicoEl.innerHTML = '<span class="text-emerald-700 font-semibold">✓ Aprobando todas las asignaturas</span>';
  } else {
    estadoAcademicoEl.innerHTML = `<span class="text-rose-600 font-semibold">⚠ ${data.estadisticas.materiasReprobadas} materia(s) en riesgo</span>`;
  }

  // Counts in tabs
  const anotaciones = data.anotaciones || [];
  const situaciones = data.situaciones || [];
  const reportes = data.reportes || [];

  document.getElementById('kpiAnotacionesCount').textContent = anotaciones.length;
  document.getElementById('kpiSituacionesCount').textContent = `${situaciones.length} situaciones`;
  document.getElementById('kpiReportesCount').textContent = `${reportes.length} reportes`;

  document.getElementById('tabBadgeObservador').textContent = anotaciones.length;
  document.getElementById('tabBadgeSituaciones').textContent = situaciones.length;
  document.getElementById('tabBadgeReportes').textContent = reportes.length;

  // Render sub-sections
  renderGradesTable(data.asignaturas, data.promediosPorPeriodo, data.promedioGeneral, data.desempenoGeneral);
  renderGradesChart(data.asignaturas);
  renderObservador(anotaciones);
  renderSituaciones(situaciones);
  renderReportes(reportes);

  // Prepare Printable Report Card
  preparePrintableBoletin(data);

  lucide.createIcons();
}

// Render grades table
function renderGradesTable(asignaturas, promediosPorPeriodo, promedioGeneral, desempenoGeneral) {
  const tbody = document.getElementById('tablaNotasBody');
  tbody.innerHTML = '';

  asignaturas.forEach((asig) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/80 transition';

    // Helper to format period cell
    const renderPeriodCell = (pNum) => {
      const p = asig.periodos[pNum];
      if (!p) return '<td class="py-3 px-2 text-center text-slate-400 font-mono text-xs col-p' + pNum + '">-</td>';
      const colorClass = p.definitiva < 3.4 ? 'text-rose-600 font-bold' : p.definitiva >= 4.6 ? 'text-emerald-700 font-bold' : 'text-slate-800 font-semibold';
      return `<td class="py-3 px-2 text-center text-xs col-p${pNum}">
        <span class="${colorClass}">${p.definitiva.toFixed(1)}</span>
      </td>`;
    };

    const defColor = asig.definitivaAnual < 3.4 ? 'text-rose-600 font-extrabold' : asig.definitivaAnual >= 4.6 ? 'text-emerald-700 font-extrabold' : 'text-slate-900 font-bold';
    const badgeClass = `badge-${asig.desempenoAnual.escala.toLowerCase()}`;

    tr.innerHTML = `
      <td class="py-3.5 px-4 font-medium text-slate-900">
        <div class="flex items-center gap-2">
          <span>${asig.nombre}</span>
          ${asig.enRiesgo ? '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">En Riesgo</span>' : ''}
        </div>
        <span class="text-[11px] text-slate-400 block">${asig.area}</span>
      </td>
      <td class="py-3.5 px-3 text-xs text-slate-600">${asig.docenteNombre}</td>
      <td class="py-3.5 px-2 text-center text-xs font-semibold text-slate-500">${asig.intensidad}h</td>
      ${renderPeriodCell(1)}
      ${renderPeriodCell(2)}
      ${renderPeriodCell(3)}
      ${renderPeriodCell(4)}
      <td class="py-3.5 px-3 text-center bg-rose-50/50">
        <span class="text-sm ${defColor}">${asig.definitivaAnual > 0 ? asig.definitivaAnual.toFixed(1) : '-'}</span>
      </td>
      <td class="py-3.5 px-3 text-center">
        <span class="inline-block px-2 py-0.5 rounded-full text-xs font-bold ${badgeClass}">
          ${asig.desempenoAnual.escala}
        </span>
      </td>
      <td class="py-3.5 px-4 text-xs text-slate-600">
        ${asig.periodos[2]?.observaciones || asig.periodos[1]?.observaciones || 'Desempeño acorde a los lineamientos del área.'}
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Footer averages
  document.getElementById('footP1').textContent = promediosPorPeriodo[1] ? promediosPorPeriodo[1].toFixed(1) : '-';
  document.getElementById('footP2').textContent = promediosPorPeriodo[2] ? promediosPorPeriodo[2].toFixed(1) : '-';
  document.getElementById('footP3').textContent = promediosPorPeriodo[3] ? promediosPorPeriodo[3].toFixed(1) : '-';
  document.getElementById('footP4').textContent = promediosPorPeriodo[4] ? promediosPorPeriodo[4].toFixed(1) : '-';
  document.getElementById('footDefinitiva').textContent = promedioGeneral.toFixed(1);
  document.getElementById('footDesempeno').innerHTML = `<span class="inline-block px-2 py-0.5 rounded-full text-xs font-bold badge-${desempenoGeneral.escala.toLowerCase()}">${desempenoGeneral.escala}</span>`;

  // Apply active period filter
  filtrarPeriodo(activePeriodoFilter);
}

// Filter periods in table
function filtrarPeriodo(periodo) {
  activePeriodoFilter = periodo;
  const cols = [1, 2, 3, 4];

  // Update button highlights
  document.querySelectorAll('.period-filter-btn').forEach((btn) => {
    btn.className = 'period-filter-btn px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200';
  });

  const activeBtn = document.getElementById(`filter-${periodo}`);
  if (activeBtn) {
    activeBtn.className = 'period-filter-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-currea-wine text-white shadow-xs';
  }

  cols.forEach((p) => {
    const elements = document.querySelectorAll(`.col-p${p}`);
    elements.forEach((el) => {
      if (periodo === 'todos' || Number(periodo) === p) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
  });
}

// Chart.js visualization
function renderGradesChart(asignaturas) {
  const ctx = document.getElementById('studentGradesChart');
  if (!ctx) return;

  if (gradesChartInstance) {
    gradesChartInstance.destroy();
  }

  const labels = asignaturas.map((a) => a.nombre.split(' ')[0]);
  const dataValues = asignaturas.map((a) => a.definitivaAnual || 0);

  // Color according to grade
  const backgroundColors = dataValues.map((val) => {
    if (val >= 4.6) return 'rgba(16, 185, 129, 0.8)'; // emerald
    if (val >= 4.0) return 'rgba(59, 130, 246, 0.8)'; // blue
    if (val >= 3.4) return 'rgba(245, 158, 11, 0.8)'; // amber
    return 'rgba(239, 68, 68, 0.85)'; // rose (reprobatorio < 3.4)
  });

  gradesChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Definitiva Actual',
          data: dataValues,
          backgroundColor: backgroundColors,
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 1.0,
          max: 5.0,
          ticks: { stepSize: 1.0 },
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        },
        x: {
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => asignaturas[items[0].dataIndex].nombre,
            label: (item) => `Nota Definitiva: ${item.raw.toFixed(1)} / 5.0`
          }
        }
      }
    }
  });
}

// Render Observer Annotations
function renderObservador(anotaciones) {
  const container = document.getElementById('listaAnotaciones');
  container.innerHTML = '';

  if (anotaciones.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
        <i data-lucide="smile" class="w-12 h-12 text-slate-300 mx-auto mb-2"></i>
        <h4 class="font-bold text-slate-700">Sin anotaciones disciplinarias</h4>
        <p class="text-xs text-slate-500">El estudiante mantiene una conducta ejemplar sin observaciones negativas registradas.</p>
      </div>
    `;
    return;
  }

  anotaciones.forEach((anot) => {
    const card = document.createElement('div');
    card.className = 'bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3';

    let badgeIcon = 'info';
    let badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
    if (anot.tipo === 'Felicitación') {
      badgeIcon = 'award';
      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    } else if (anot.tipo === 'Llamado de Atención') {
      badgeIcon = 'alert-triangle';
      badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
    } else if (anot.tipo.includes('Compromiso')) {
      badgeIcon = 'clipboard-signature';
      badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
    }

    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}">
            <i data-lucide="${badgeIcon}" class="w-3.5 h-3.5"></i>
            ${anot.tipo}
          </span>
          <span class="text-xs font-semibold text-slate-700">${anot.materia || 'Comportamiento Escolar'}</span>
        </div>
        <div class="flex items-center gap-2 text-xs text-slate-400">
          <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
          <span>${anot.fecha}</span>
        </div>
      </div>

      <div>
        <h4 class="font-bold text-slate-900 text-sm">${anot.titulo}</h4>
        <p class="text-xs text-slate-600 mt-1.5 leading-relaxed">${anot.descripcion}</p>
      </div>

      ${anot.descargoEstudiante ? `
        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
          <strong class="text-slate-700 block mb-0.5">Descargo del Estudiante:</strong>
          <p class="text-slate-600 italic">"${anot.descargoEstudiante}"</p>
        </div>
      ` : ''}

      ${anot.compromiso ? `
        <div class="bg-amber-50/60 p-3 rounded-lg border border-amber-200/60 text-xs text-amber-900">
          <strong class="block mb-0.5">Compromiso Formativo Asumido:</strong>
          <p>${anot.compromiso}</p>
        </div>
      ` : ''}

      <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
        <span>Docente que registra: <strong>${anot.docenteNombre}</strong></span>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${anot.estado === 'Cumplido' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}">
          Estado: ${anot.estado || 'En Seguimiento'}
        </span>
      </div>
    `;
    container.appendChild(card);
  });
}

// Render Coexistence Situations (Ley 1620)
function renderSituaciones(situaciones) {
  const container = document.getElementById('listaSituaciones');
  container.innerHTML = '';

  if (situaciones.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
        <i data-lucide="shield-check" class="w-12 h-12 text-emerald-500 mx-auto mb-2"></i>
        <h4 class="font-bold text-slate-700">Sin situaciones de convivencia registradas</h4>
        <p class="text-xs text-slate-500">El estudiante no registra faltas tipificadas según el Manual de Convivencia y la Ley 1620.</p>
      </div>
    `;
    return;
  }

  situaciones.forEach((sit) => {
    const card = document.createElement('div');
    card.className = 'bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3';

    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            ${sit.tipo} (Ley 1620)
          </span>
          <span class="text-xs text-slate-500 font-medium">${sit.fecha}</span>
        </div>
        <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${sit.estado === 'Cerrada' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
          ${sit.estado}
        </span>
      </div>

      <div class="text-xs text-slate-700 space-y-2">
        <p><strong>Descripción del Hecho:</strong> ${sit.descripcion}</p>
        <p><strong>Acciones Pedagógicas y Restaurativas:</strong> ${sit.accionesPedagogicas}</p>
        ${sit.resolucion ? `<p class="bg-emerald-50 p-2.5 rounded border border-emerald-200 text-emerald-900"><strong>Resolución del Caso:</strong> ${sit.resolucion}</p>` : ''}
      </div>

      <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Docente / Mediador: <strong>${sit.docenteNombre}</strong></span>
        <span>${sit.acudienteCitado ? '✓ Acudiente Citado' : 'Sin citación a acudiente'}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// Render Academic Recovery Reports
function renderReportes(reportes) {
  const container = document.getElementById('listaReportes');
  container.innerHTML = '';

  if (reportes.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
        <i data-lucide="check-circle" class="w-12 h-12 text-emerald-500 mx-auto mb-2"></i>
        <h4 class="font-bold text-slate-700">Sin materias reportadas</h4>
        <p class="text-xs text-slate-500">¡Felicitaciones! No tienes alertas tempranas ni planes de mejoramiento pendientes.</p>
      </div>
    `;
    return;
  }

  reportes.forEach((rep) => {
    const card = document.createElement('div');
    card.className = 'bg-white p-5 rounded-xl border border-rose-200 shadow-xs space-y-3 relative overflow-hidden';

    // Left border accent
    const statusColor = rep.estado === 'Superado' ? 'bg-emerald-500' : rep.estado === 'En Nivelación' ? 'bg-amber-500' : 'bg-rose-500';

    card.innerHTML = `
      <div class="absolute top-0 left-0 bottom-0 w-1.5 ${statusColor}"></div>
      
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 pl-2">
        <div>
          <span class="text-xs font-bold uppercase text-rose-700 tracking-wider">Alerta Académica • Periodo ${rep.periodo}</span>
          <h4 class="text-base font-bold text-slate-900">${rep.materiaNombre}</h4>
        </div>
        <div class="text-right">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${rep.estado === 'Superado' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            ${rep.estado}
          </span>
          <span class="block text-xs text-rose-600 font-extrabold mt-1">Nota Actual: ${rep.notaActual.toFixed(1)}</span>
        </div>
      </div>

      <div class="text-xs text-slate-700 space-y-2 pl-2">
        <p><strong>Causa del Reporte:</strong> ${rep.motivo}</p>
        <div class="bg-rose-50/60 p-3 rounded-lg border border-rose-100">
          <strong class="text-currea-wine block mb-1">Plan de Mejoramiento Asignado:</strong>
          <p class="text-slate-800 leading-relaxed">${rep.planMejoramiento}</p>
        </div>
      </div>

      <div class="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 pl-2">
        <span>Docente Responsable: <strong>${rep.docenteNombre}</strong></span>
        <span>Fecha Límite de Sustentación: <strong class="text-rose-700 font-bold">${rep.fechaLimite}</strong></span>
      </div>
    `;
    container.appendChild(card);
  });
}

// Prepare Printable Official Boletín
function preparePrintableBoletin(data) {
  const est = data.estudiante;
  document.getElementById('printNombre').textContent = est.nombre;
  document.getElementById('printDoc').textContent = est.documento || '1023456789';
  document.getElementById('printCodigo').textContent = est.codigo || 'EST-2026-1001';
  document.getElementById('printGrupo').textContent = `${est.grado || '10°'} (${est.grupo || '1001'})`;
  document.getElementById('printJornada').textContent = est.jornada || 'Mañana';
  document.getElementById('printPuesto').textContent = `${data.puestoEnGrupo} de ${data.totalEstudiantesGrupo}`;
  document.getElementById('printPromedio').textContent = `${data.promedioGeneral.toFixed(1)} (${data.desempenoGeneral.escala.toUpperCase()})`;
  document.getElementById('printCodVerif').textContent = `MC-2026-${est.codigo?.slice(-4) || '9999'}`;

  const tbody = document.getElementById('printTablaNotasBody');
  tbody.innerHTML = '';

  data.asignaturas.forEach((asig) => {
    const p1 = asig.periodos[1]?.definitiva ? asig.periodos[1].definitiva.toFixed(1) : '-';
    const p2 = asig.periodos[2]?.definitiva ? asig.periodos[2].definitiva.toFixed(1) : '-';
    const p3 = asig.periodos[3]?.definitiva ? asig.periodos[3].definitiva.toFixed(1) : '-';
    const p4 = asig.periodos[4]?.definitiva ? asig.periodos[4].definitiva.toFixed(1) : '-';
    const def = asig.definitivaAnual > 0 ? asig.definitivaAnual.toFixed(1) : '-';
    const obs = asig.periodos[2]?.observaciones || asig.periodos[1]?.observaciones || 'Desempeño satisfactorio en los logros previstos.';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="border border-slate-600 p-1 text-left font-medium">
        <div class="font-bold text-black">${asig.nombre}</div>
        <div class="text-[7pt] text-slate-600">Docente: ${asig.docenteNombre}</div>
      </td>
      <td class="border border-slate-600 p-1 text-center font-bold">${asig.intensidad}h</td>
      <td class="border border-slate-600 p-1 text-center">${p1}</td>
      <td class="border border-slate-600 p-1 text-center">${p2}</td>
      <td class="border border-slate-600 p-1 text-center">${p3}</td>
      <td class="border border-slate-600 p-1 text-center">${p4}</td>
      <td class="border border-slate-600 p-1 text-center font-bold bg-slate-100">${def}</td>
      <td class="border border-slate-600 p-1 text-center font-bold text-[8pt]">${asig.desempenoAnual.escala}</td>
      <td class="border border-slate-600 p-1 text-left text-[7pt] text-slate-800">${obs}</td>
    `;
    tbody.appendChild(tr);
  });

  // Observador summary on print
  const obsContainer = document.getElementById('printObservadorSummary');
  if (data.anotaciones && data.anotaciones.length > 0) {
    obsContainer.innerHTML = data.anotaciones.slice(0, 3).map((a) => `
      <div>• <strong>[${a.fecha} - ${a.tipo}]</strong> ${a.titulo}: ${a.descripcion}</div>
    `).join('');
  } else {
    obsContainer.innerHTML = '<div>• El estudiante no presenta anotaciones desfavorables en el periodo escolar. Mantiene excelente disciplina y convivencia.</div>';
  }
}

// Print action
function imprimirBoletin() {
  window.print();
}

// Tab navigation handler
function cambiarPestana(tabName) {
  const tabs = ['notas', 'observador', 'situaciones', 'reportes'];
  tabs.forEach((t) => {
    const content = document.getElementById(`tab-${t}`);
    const btn = document.getElementById(`tabBtn-${t}`);
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

// Demo student switch
function cambiarEstudianteDemo(studentId) {
  checkAuthAndLoad(studentId);
}

// Logout handler
async function logout() {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
  } catch (e) {}
  localStorage.removeItem('macuma_user');
  localStorage.removeItem('macuma_token');
  window.location.href = window.location.protocol === 'file:' ? 'index.html' : '/index.html';
}
