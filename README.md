# Sistema de Gestión Académica y Convivencial
## Colegio Institución Educativa Distrital María Currea Manrique (I.E.D.)
*Lema Institucional: Respeto • Justicia • Autonomía (Respect • Justice • Autonomy)*

---

### 🏛️ Descripción General
Plataforma web integral diseñada para la **I.E.D. María Currea Manrique**, que permite a los estudiantes consultar sus calificaciones, su promedio escolar acumulado, anotaciones del observador y boletines oficiales en PDF; y a los docentes ingresar notas ponderadas, registrar anotaciones formativas, reportar situaciones de convivencia (Ley 1620) y gestionar alertas tempranas por materia con planes de mejoramiento pedagógico.

---

### 🚀 Cómo Iniciar el Sistema

#### Opción 1: Inicio Rápido (1 Clic en Windows)
Haga doble clic en el archivo:
```text
iniciar_sistema.bat
```
Este script iniciará automáticamente el servidor Node.js y abrirá su navegador en `http://localhost:3000`.

#### Opción 2: Desde la Terminal
```bash
# Iniciar servidor
npm start
# o directamente:
node server.js
```
Abra en su navegador web favorito: **[http://localhost:3000](http://localhost:3000)**

---

### 🔑 Cuentas de Demostración Preconfiguradas
Todas las cuentas de prueba tienen la contraseña predeterminada: `123456`

| Rol | Usuario | Contraseña | Nombre / Cargo | Características Destacadas |
| :--- | :--- | :--- | :--- | :--- |
| **Estudiante** | `estudiante1` | `123456` | Santiago Gómez (1001) | Desempeño Alto/Superior, con felicitaciones en el observador |
| **Estudiante** | `estudiante3` | `123456` | Mateo Torres (1001) | Estudiante con alertas académicas y planes de recuperación |
| **Estudiante** | `estudiante2` | `123456` | Valentina Restrepo (1001) | Excelencia académica, puesto #1 en el curso |
| **Docente** | `docente1` | `123456` | Prof. Carlos Morales | Docente de Matemáticas y Física (Grados 1001, 1002, 1101) |
| **Docente** | `docente2` | `123456` | Profa. Sandra Gómez | Docente de Lengua Castellana e Inglés |
| **Coordinador** | `coordinador` | `123456` | Prof. Esperanza Manrique | Coordinación Académica y de Convivencia General |

> **Nota:** En la pantalla de inicio de sesión (`http://localhost:3000`), encontrará botones de **acceso rápido** con un solo clic para cargar directamente cualquiera de estas cuentas sin tener que escribir.

---

### 🌟 Módulos y Funcionalidades

#### 1. Perfil del Estudiante (`/estudiante.html`)
- **Tarjeta de Identidad Escolar:** Código de matrícula, documento de identidad, curso, jornada y datos de contacto de acudiente.
- **Cálculo Automático de Promedio General:** Promedio escolar ponderado y escala institucional colombiana.
- **Puesto en el Salón:** Ranking relativo del curso en tiempo real.
- **Sabana de Notas y Filtro por Periodos:** Desglose por asignatura con notas de los Periodos 1, 2, 3, 4 y definitiva anual.
- **Gráfica Interactiva de Rendimiento:** Comparativo visual de notas por materia.
- **Boletín Oficial de Calificaciones (PDF / Impresión):** Formato institucional con el escudo del colegio, rectoría, coordinación, tabla de notas y código QR de validación.
- **Observador del Alumno:** Historial de reconocimientos, llamados de atención y compromisos suscritos.
- **Situaciones de Convivencia (Ley 1620):** Tipificación y medidas pedagógicas y restaurativas.
- **Alertas y Planes de Mejoramiento:** Notificación de materias reportadas, actividades de recuperación y fechas límite de sustentación.

#### 2. Perfil del Docente (`/profesor.html`)
- **Planilla Interactiva de Calificaciones:**
  - Selector dinámico de Grado/Curso (1001, 1002, 1101), Materia y Periodo Escolar (1 a 4).
  - Ponderación oficial: **Saber / Cognitivo (40%)**, **Hacer / Procedimental (40%)**, **Ser / Convivencia (20%)**.
  - Cálculo instantáneo en tiempo real de la definitiva y escala cualitativa al digitar.
  - Guardado en lote (*Bulk Save*) con confirmación inmediata.
- **Personas Reportadas por Materia (Alertas Tempranas):**
  - Detección y reporte de estudiantes con calificación menor a 3.0.
  - Asignación de **Plan de Mejoramiento Pedagógico** con actividades, talleres y fecha límite.
  - Modificación de estado formativo: `Reportado` ➔ `En Nivelación` ➔ `Superado` / `No Superado`.
- **Observador del Alumno:**
  - Registro de observaciones directas con tipo (*Felicitación, Llamado de Atención, Compromiso Académico, Compromiso Convivencial*).
  - Redacción de compromisos suscritos con el alumno.
- **Situaciones de Convivencia (Ley 1620):**
  - Clasificación en situaciones **Tipo I**, **Tipo II** y **Tipo III**.
  - Registro de acciones pedagógicas restaurativas y citación a acudientes con fecha programada.
  - Cierre y resolución de casos ante el comité escolar.

#### 3. Panel de Coordinación General (`/coordinador.html`)
- Métricas institucionales de aprobación y reprobación.
- Monitoreo global de alertas académicas en todas las materias.
- Supervisión de situaciones de convivencia escolar.

---

### 📊 Escala Institucional de Valoración (Nota Mínima Aprobatoria: 3.4)

| Nivel de Desempeño | Rango Numérico | Criterio de Evaluación |
| :--- | :--- | :--- |
| **Superior** | `4.6 a 5.0` | Supera ampliamente los logros esperados y demuestra liderazgo formativo. |
| **Alto** | `4.0 a 4.5` | Alcanza la totalidad de los logros académicos con alto nivel de responsabilidad. |
| **Básico** | `3.4 a 3.9` | **Aprobatorio**: Cumple con los requerimientos mínimos de la institución (Mínima: 3.4). |
| **Bajo** | `1.0 a 3.3` | **Reprobatorio / En Riesgo**: No alcanza los logros previstos. Requiere Plan de Mejoramiento. |

---

### 🛡️ Seguridad y Persistencia
- Autenticación mediante **JSON Web Tokens (JWT)** y cookies seguras.
- Cifrado de contraseñas mediante **bcryptjs**.
- Control de acceso por roles (*Role-Based Access Control*): rutas de docentes y administradores protegidas.
- Persistencia local en archivo estructurado `data/database.json`.
- Escudo oficial del colegio integrado en `public/assets/escudo.png`.
