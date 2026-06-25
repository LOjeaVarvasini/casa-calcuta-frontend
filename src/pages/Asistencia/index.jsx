import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getFamiliasPrincipalesRequest,
  createRegistroAsistenciaRequest,
  getHistorialAsistenciaRequest,
} from '../../config/api.js';

// Helper para obtener la fecha de hoy en GMT-3 (Argentina)
function obtenerFechaHoyGMT3() {
  const ahora = new Date();
  const offsetGMT3 = -3 * 60;
  const fechaLocal = new Date(ahora.getTime() + (ahora.getTimezoneOffset() + offsetGMT3) * 60000);
  return fechaLocal.toISOString().split('T')[0];
}

// Helper para formatear fecha ISO (YYYY-MM-DD) a DD / MM / YYYY legible
function formatearFechaLegible(fechaISO) {
  if (!fechaISO) return '[Fecha]';
  const partes = fechaISO.split('-');
  return `${partes[2]} / ${partes[1]} / ${partes[0]}`;
}

function Asistencia({ onNavegar, parametros }) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(obtenerFechaHoyGMT3());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔍 ESTADO DEL BUSCADOR
  const [busqueda, setBusqueda] = useState('');

  // Estados de datos sincronizados
  const [familias, setFamilias] = useState([]);
  const [historialAsistencia, setHistorialAsistencia] = useState({});
  const [estadosFamilias, setEstadosFamilias] = useState({});

  // Estado de guardado masivo
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(null);

  // Estados de Modales Rediseñados
  const [modalGuardadoAbierto, setModalGuardadoAbierto] = useState(false);
  const [resultadoGuardado, setResultadoGuardado] = useState({ total: 0, ausentes: 0 });
  const [familiasCriticasReportadas, setFamiliasCriticasReportadas] = useState([]);

  // Cargar historial operativo filtrando por la ventana móvil de los 30 días previos
  const cargarHistorial = useCallback(async () => {
    try {
      const respuesta = await getHistorialAsistenciaRequest('per_page=100');
      const registros = respuesta.data || [];

      const fechaBase = new Date(fechaSeleccionada + 'T12:00:00');
      const limiteInferior = new Date(fechaBase.getTime());
      limiteInferior.setDate(limiteInferior.getDate() - 30);

      const historialIndexado = {};

      registros.forEach((registro) => {
        const limpiaISO = registro.fecha.split('T')[0];
        const fechaRegistro = new Date(limpiaISO + 'T12:00:00');

        if (fechaRegistro >= limiteInferior && fechaRegistro < fechaBase) {
          const fid = registro.familia_id;
          if (!historialIndexado[fid]) {
            historialIndexado[fid] = [];
          }
          historialIndexado[fid].push(registro);
        }
      });

      Object.keys(historialIndexado).forEach((fid) => {
        historialIndexado[fid].sort((a, b) => new Date(a.fecha.split('T')[0] + 'T12:00:00') - new Date(b.fecha.split('T')[0] + 'T12:00:00'));
      });

      setHistorialAsistencia(historialIndexado);
      return registros;
    } catch (err) {
      console.warn('Historial no disponible:', err);
      setHistorialAsistencia({});
      return [];
    }
  }, [fechaSeleccionada]);

  const cargarFamilias = useCallback(async () => {
    try {
      const respuesta = await getFamiliasPrincipalesRequest('per_page=100');
      let listaCompleta = respuesta.data || [];

      let filtradas = listaCompleta.filter(
        (f) => (f.estado_lista || '').toUpperCase() === 'PRINCIPAL' && f.activa === true
      );

      if (parametros?.familiaId) {
        filtradas = filtradas.filter((f) => f.id_familia === parseInt(parametros.familiaId, 10));
      }

      setFamilias(filtradas);
      return filtradas;
    } catch (err) {
      throw new Error(err.message || 'Error al descargar el padrón de familias.');
    }
  }, [parametros]);

  // Sincronización inicial
  useEffect(() => {
    const sincronizarDatosPlanilla = async () => {
      setLoading(true);
      setError(null);
      try {
        const [listaF, todosLosRegistros] = await Promise.all([cargarFamilias(), cargarHistorial()]);
        
        const estadosIniciales = {};
        listaF.forEach((familia) => {
          const yaExisteFaltaEsteDia = todosLosRegistros.some(
            (r) => r.familia_id === familia.id_familia && r.fecha.split('T')[0] === fechaSeleccionada && (r.estado === 'ausente' || r.estado === 'falta')
          );
          estadosIniciales[familia.id_familia] = yaExisteFaltaEsteDia ? 'falta' : 'retirado';
        });
        setEstadosFamilias(estadosIniciales);

      } catch (err) {
        setError(err.message || 'No se pudo sincronizar el estado del backend.');
      } finally {
        setLoading(false);
      }
    };
    sincronizarDatosPlanilla();
  }, [fechaSeleccionada, cargarFamilias, cargarHistorial]);

  // Filtrado reactivo en caliente de familias mediante input buscador
  const familiasFiltradas = useMemo(() => {
    const query = busqueda.toLowerCase().trim();
    if (!query) return familias;

    return familias.filter((f) => {
      const apellido = (f.referente?.apellido || '').toLowerCase();
      const nombre = (f.referente?.nombre || '').toLowerCase();
      return apellido.includes(query) || nombre.includes(query);
    });
  }, [familias, busqueda]);

  const calcularTriadaHistorial = useCallback((familiaId) => {
    const registros = historialAsistencia[familiaId] || [];
    const mapeoEstados = registros.map((r) => {
      const est = (r.estado || '').toLowerCase().trim();
      return !(est === 'ausente' || est === 'falta' || est === 'no retiró');
    });

    const ultimosTresEventos = mapeoEstados.slice(-3);
    const casillerosFaltantes = Math.max(0, 3 - ultimosTresEventos.length);
    const rellenoVerde = Array(casillerosFaltantes).fill(true);

    return [...rellenoVerde, ...ultimosTresEventos];
  }, [historialAsistencia]);

  // Algoritmo con validación de brecha temporal de 7 días (Anti-Falsos Positivos)
  const contarFaltasConsecutivas = (familiaId) => {
    const registros = historialAsistencia[familiaId] || [];
    if (registros.length === 0) return 0;

    let faltasConsecutivas = 0;
    
    // Forzamos la hora al mediodía para que la resta de milisegundos sea exacta
    let fechaReferencia = new Date(fechaSeleccionada + 'T12:00:00');

    // Recorremos las inasistencias del backend de atrás para adelante (de la más nueva a la más vieja)
    for (let i = registros.length - 1; i >= 0; i--) {
      const registroActual = registros[i];
      const fechaRegistro = new Date(registroActual.fecha.split('T')[0] + 'T12:00:00');

      // Calculamos la distancia en días entre la jornada que estamos evaluando y el registro de la falta
      const diferenciaMilisegundos = fechaReferencia.getTime() - fechaRegistro.getTime();
      const distanciaDias = Math.round(diferenciaMilisegundos / (1000 * 60 * 60 * 24));

      // 🚨 LA REGLA DE ORO DE LOS 7 DÍAS:
      // Si es la primera falta que evaluamos (distancia 0 porque coincide con el switch) o si la falta 
      // anterior pasó exactamente hace 7 días (una semana atrás), la racha sigue firme.
      if (distanciaDias === 0 || distanciaDias === 7) {
        faltasConsecutivas++;
        // Movemos nuestro puntero de referencia a la fecha de esta falta para evaluar la siguiente
        fechaReferencia = fechaRegistro;
      } else if (distanciaDias > 7) {
        // 🛑 ¡ALERTA! Si pasaron 14 días o más entre registros, significa que en el medio hubo un sábado 
        // libre donde la familia SÍ retiró su porción. La consecutividad se rompió por completo acá.
        break;
      }
    }

    return faltasConsecutivas;
  };

  const faltasConsecutivasMap = useMemo(() => {
    const mapa = {};
    familias.forEach((familia) => {
      mapa[familia.id_familia] = contarFaltasConsecutivas(familia.id_familia);
    });
    return mapa;
  }, [familias, historialAsistencia]);

  const handleGuardar = async () => {
    setGuardando(true);
    setErrorGuardado(null);

    const familiasAusentes = familias.filter((f) => estadosFamilias[f.id_familia] === 'falta');

    // 🚨 PROCESAMIENTO PREVENTIVO: Consolidamos la lista de familias que llegan a la 3° falta consecutiva HOY
    const detectadasCriticas = [];
    familiasAusentes.forEach((f) => {
      const faltasPrevias = faltasConsecutivasMap[f.id_familia] || 0;
      if (faltasPrevias >= 2) {
        detectadasCriticas.push({
          id: f.id_familia,
          apellido: f.referente?.apellido || 'Designada',
          referente: `${f.referente?.nombre || ''} ${f.referente?.apellido || ''}`,
          totalFaltas: faltasPrevias + 1
        });
      }
    });

    if (familiasAusentes.length === 0) {
      setResultadoGuardado({ total: familias.length, ausentes: 0 });
      setFamiliasCriticasReportadas([]);
      setModalGuardadoAbierto(true);
      setGuardando(false);
      return;
    }

    try {
      const promesas = familiasAusentes.map((familia) =>
        createRegistroAsistenciaRequest({
          familia_id: parseInt(familia.id_familia, 10),
          id_familia: parseInt(familia.id_familia, 10),
          fecha: fechaSeleccionada,
          estado: 'ausente',
        })
      );

      await Promise.all(promesas);

      setResultadoGuardado({ total: familias.length, ausentes: familiasAusentes.length });
      setFamiliasCriticasReportadas(detectadasCriticas); // Seteamos las alertas consolidadas
      setModalGuardadoAbierto(true);

      await Promise.all([cargarFamilias(), cargarHistorial()]);
    } catch (err) {
      setErrorGuardado(err.message || 'Error al impactar los registros en el servidor de producción.');
    } finally {
      setGuardando(false);
    }
  };

  const totalRacionesProvisionales = familias.length * 3;

  return (
    <div className="attendance-view" style={{ width: '100%' }}>
      {parametros?.familiaId && (
        <div className="info-profile-box" style={{ marginBottom: 'var(--space-md)' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
            📋 Modo Inspección: Filtrando planilla para la Familia ID #{parametros.familiaId}
          </span>
        </div>
      )}

      {error && <div className="login-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}
      {errorGuardado && <div className="login-error" style={{ marginBottom: 'var(--space-md)' }}>{errorGuardado}</div>}

      {/* PANEL DE METADATOS Y CONTROL DE FECHA */}
      <section className="info-profile-box" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', wrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center' }}>
          <div>
            <label htmlFor="input-fecha-jornada" style={{ display: 'block', fontSize: 'var(--text-sm)', color: '#718096', fontWeight: 700, marginBottom: '4px' }}>
              Fecha de Entrega
            </label>
            <input 
              id="input-fecha-jornada"
              type="date" 
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="form-control"
              style={{ height: '38px', maxWidth: '180px', fontWeight: 600, padding: '0 var(--space-xs)', cursor: 'pointer' }}
            />
          </div>
          <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: 'var(--space-md)' }}>
            <span style={{ display: 'block', fontSize: 'var(--text-sm)', color: '#718096', fontWeight: 600, marginBottom: '4px' }}>Porciones Tot</span>
            <strong style={{ fontSize: 'var(--text-md)', color: 'var(--color-primary)', display: 'block', height: '38px', paddingTop: '6px' }}>
              {totalRacionesProvisionales} Raciones
            </strong>
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={handleGuardar}
          disabled={guardando || loading}
          style={{ minHeight: '40px', marginTop: 'auto' }}
        >
          {guardando ? '⏳ Guardando...' : '💾 Guardar Planilla'}
        </button>
      </section>

      {/* 🔍 BARRA DE BÚSQUEDA OPERATIVA EN CALIENTE */}
      <section className="page-toolbar" style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm)' }}>
        <div className="search-filter-group" style={{ maxWidth: '100%' }}>
          <input 
            type="text" 
            placeholder="🔍 Buscar familia por apellido o referente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="form-control"
            style={{ height: '40px', fontSize: 'var(--text-sm)' }}
          />
        </div>
      </section>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-primary)', fontWeight: 600 }}>
          Sincronizando registros para el día {formatearFechaLegible(fechaSeleccionada)}...
        </div>
      )}

      {/* PLANILLA DE CONTROL OPERATIVO */}
      {!loading && !error && (
        <section className="table-responsive-container" style={{ marginTop: 'var(--space-sm)' }}>
          <table className="custom-table custom-table-responsive">
            <thead>
              <tr>
                <th>Familia / Referente</th>
                <th>Raciones Asignadas</th>
                <th>Historial Reciente</th>
                <th style={{ textAlign: 'center' }}>Control de Entrega</th>
              </tr>
            </thead>
            <tbody>
              {familiasFiltradas.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: 'var(--space-lg)', color: '#718096' }}>
                    No se encontraron familias que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
              {familiasFiltradas.map((family) => {
                const ref = family.referente || {};
                const triada = calcularTriadaHistorial(family.id_familia);
                const faltasConsecutivas = faltasConsecutivasMap[family.id_familia] || 0;
                const estaAusente = estadosFamilias[family.id_familia] === 'falta';

                return (
                  <tr key={family.id_familia}>
                    <td data-label="Familia">
                      <strong style={{ color: 'var(--color-text)', fontSize: 'var(--text-sm)' }}>
                        {ref.apellido || `Familia #${family.id_familia}`}
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#718096' }}>
                        Ref: {ref.nombre || '[Sin Nombre]'} {ref.apellido || ''}
                      </p>
                    </td>
                    <td data-label="Raciones">
                      <span className="badge badge-primary" style={{ textTransform: 'none' }}>
                        3 Porciones
                      </span>
                    </td>
                    <td data-label="Historial">
                      <div className="history-dots" style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-start', minHeight: '12px' }}>
                        {triada.map((asistio, idx) => (
                          <span
                            key={`dot-${family.id_familia}-${idx}`}
                            title={asistio ? 'Retiró' : 'No retiró'}
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              display: 'inline-block',
                              backgroundColor: asistio ? '#22c55e' : '#ef4444'
                            }}
                          ></span>
                        ))}
                      </div>
                    </td>
                    <td data-label="Control" style={{ textAlign: 'center' }}>
                      <div className="switch-toggle-group">
                        <div className="switch-toggle-item">
                          <input
                            type="radio"
                            id={`f${family.id_familia}-retirado`}
                            name={`family-${family.id_familia}`}
                            checked={estadosFamilias[family.id_familia] === 'retirado'}
                            onChange={() => setEstadosFamilias(prev => ({ ...prev, [family.id_familia]: 'retirado' }))}
                          />
                          <label htmlFor={`f${family.id_familia}-retirado`}>Retirado</label>
                        </div>
                        <div className="switch-toggle-item">
                          <input
                            type="radio"
                            id={`f${family.id_familia}-falta`}
                            name={`family-${family.id_familia}`}
                            checked={estadosFamilias[family.id_familia] === 'falta'}
                            onChange={() => setEstadosFamilias(prev => ({ ...prev, [family.id_familia]: 'falta' }))}
                          />
                          <label
                            htmlFor={`f${family.id_familia}-falta`}
                            className={estaAusente && faltasConsecutivas >= 2 ? 'pulse-warning' : ''}
                            style={{ color: estaAusente && faltasConsecutivas >= 2 ? 'var(--color-danger)' : '#718096' }}
                          >
                            No Retiró
                          </label>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* 🍏 MODAL UNIFICADO: CONFIRMACIÓN DE GUARDADO CON REPORTE DE EXCLUSIONES */}
      {modalGuardadoAbierto && (
        <div className="modal-overlay" onClick={() => setModalGuardadoAbierto(false)}>
          <div className="modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✅ Planilla Procesada</h3>
            </div>
            <div className="modal-body">
              <p>La planilla del día <strong>{formatearFechaLegible(fechaSeleccionada)}</strong> ha sido impactada en el servidor cloud.</p>
              <p style={{ marginTop: '0.5rem', color: '#718096', fontSize: 'var(--text-sm)' }}>
                Total: <strong>{resultadoGuardado.total}</strong> familias procesadas. Inasistencias de hoy: <strong>{resultadoGuardado.ausentes}</strong>.
              </p>

              {/* 🚨 REPORTE DE ALERTAS CONSOLIDADO AL FINAL DEL DÍA */}
              {familiasCriticasReportadas.length > 0 && (
                <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm)', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '6px' }}>
                    ⚠️ REPORTE DE AUSENTISMO CRÍTICO (Racha de {fechaSeleccionada.split('-')[1]}/2026)
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '8px' }}>
                    Las siguientes familias acumularon 3 o más faltas consecutivas hoy. Se sugiere derivar a auditoría social:
                  </p>
                  <ul style={{ paddingLeft: 'var(--space-md)', margin: 0, fontSize: 'var(--text-sm)' }}>
                    {familiasCriticasReportadas.map((f) => (
                      <li key={f.id} style={{ color: '#9b2c2c', marginBottom: '4px', fontWeight: 600 }}>
                        ❌ Familia {f.apellido} <span style={{ fontWeight: 500, color: '#4a5568' }}>(Ref: {f.referente})</span> — {f.totalFaltas} Faltas Seguidas.
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-primary" style={{ minHeight: '40px' }} onClick={() => setModalGuardadoAbierto(false)}>Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Asistencia;