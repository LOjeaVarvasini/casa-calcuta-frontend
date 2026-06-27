import { useState, useEffect, useCallback, useMemo } from 'react';
import { getFamiliasPrincipalesRequest, updateEstadoListaRequest } from '../../config/api.js';
import './listas.css';

function obtenerClaseBadgePrioridad(prioridad) {
  const pr = (prioridad || '').toLowerCase().trim();
  if (pr === 'muy_alta' || pr === 'muy alta' || pr === 'critica') return 'badge badge-danger';
  if (pr === 'alta' || pr === 'media') return 'badge badge-warning';
  return 'badge badge-primary';
}

function formatearPrioridadText(prioridad) {
  if (!prioridad) return 'Baja';
  return prioridad.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatearFechaLegible(fechaISO) {
  if (!fechaISO) return 'No informada';
  const partes = fechaISO.split('T')[0].split('-');
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function Listas({ onNavegar, parametros, session }) {
  const [tabActiva, setTabActiva] = useState('espera'); // 'espera' o 'principal'
  
  // Guardamos el padrón crudo que viene de la base de datos
  const [padrónCrudo, setPadrónCrudo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mutandoId, setMutandoId] = useState(null);

  const usuarioId = session?.user?.id_usuario || 1;

  // Descarga del padrón completo sin confiar en los filtros rotos del backend
  const descargarPadrones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const respuesta = await getFamiliasPrincipalesRequest('per_page=100');
      setPadrónCrudo(respuesta?.data || []);
    } catch (err) {
      setError(err.message || 'No se pudo sincronizar el listado de control social.');
      setPadrónCrudo([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    descargarPadrones();
  }, [descargarPadrones]);

  // 🎯 FILTRADO SENIOR EN FRONTEND: Dividimos las listas de forma reactiva y exacta
  const familiasSegmentadas = useMemo(() => {
    return padrónCrudo.filter((f) => {
      const estadoFamilia = (f.estado_lista || '').toLowerCase().trim();
      if (tabActiva === 'espera') {
        return estadoFamilia === 'espera';
      }
      return estadoFamilia === 'principal';
    });
  }, [padrónCrudo, tabActiva]);

  // Contadores exactos para los números de las pestañas
  const conteos = useMemo(() => {
    let espera = 0;
    let principal = 0;
    padrónCrudo.forEach((f) => {
      const est = (f.estado_lista || '').toLowerCase().trim();
      if (est === 'espera') espera++;
      if (est === 'principal') principal++;
    });
    return { espera, principal };
  }, [padrónCrudo]);

  const handleCambiarEstadoLista = async (familiaId, nuevoEstado) => {
    setMutandoId(familiaId);
    try {
      await updateEstadoListaRequest(familiaId, {
        estado_lista: nuevoEstado,
        registrado_por: usuarioId
      });
      
      // Actualización optimista local para que el cambio sea instantáneo en pantalla
      setPadrónCrudo((prev) => 
        prev.map((f) => f.id_familia === familiaId ? { ...f, estado_lista: nuevoEstado.toUpperCase() } : f)
      );
    } catch (err) {
      alert(err.message || 'Error al impactar la promoción en el servidor cloud.');
    } finally {
      setMutandoId(null);
    }
  };

  return (
    <div className="listas-module" style={{ width: '100%' }}>
      
      {error && <div className="login-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

      {/* PESTAÑAS DE CONTEXTO REALES */}
      <div className="list-tabs-container">
        <button 
          className={`tab-btn ${tabActiva === 'espera' ? 'active' : ''}`}
          onClick={() => setTabActiva('espera')}
        >
          Lista de Espera ({conteos.espera})
        </button>
        <button 
          className={`tab-btn ${tabActiva === 'principal' ? 'active' : ''}`}
          onClick={() => setTabActiva('principal')}
        >
          Lista Principal ({conteos.principal})
        </button>
      </div>

      {/* TABLA ANTIDESBORDAMIENTO RESPONSIVE */}
      <section className="table-responsive-container">
        <table className="custom-table custom-table-responsive">
          <thead>
            <tr>
              <th>Familia</th>
              <th>Porciones</th>
              <th>Prioridad</th>
              <th>Fecha Ingreso</th>
              <th style={{ textAlign: 'center' }}>Acciones Operativas</th>
            </tr>
          </thead>
          <tbody>
            
            {loading && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--color-primary)', fontWeight: 600 }}>
                  Aislando padrones de forma segura...
                </td>
              </tr>
            )}

            {!loading && familiasSegmentadas.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-lg)', color: '#718096' }}>
                  No hay registros en la Lista de {tabActiva === 'espera' ? 'Espera' : 'Padrón Principal'}.
                </td>
              </tr>
            )}

            {!loading && familiasSegmentadas.map((family) => {
              const ref = family.referente || {};
              const totalPorciones = family.porciones_comida || 3;
              const estaProcesando = mutandoId === family.id_familia;

              return (
                <tr key={family.id_familia}>
                  <td data-label="Familia">
                    <strong style={{ color: 'var(--color-text)' }}>
                      {ref.apellido || `Familia #${family.id_familia}`}
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#718096' }}>
                      Ref: {ref.nombre || ''} {ref.apellido || ''}
                    </p>
                  </td>
                  <td data-label="Porciones">
                    <span className="portions-count">{totalPorciones} Raciones</span>
                  </td>
                  <td data-label="Prioridad">
                    <span className={obtenerClaseBadgePrioridad(family.prioridad_social)}>
                      {formatearPrioridadText(family.prioridad_social)}
                    </span>
                  </td>
                  <td data-label="Fecha Ingreso">
                    {formatearFechaLegible(family.fecha_ingreso || family.created_at)}
                  </td>
                  <td data-label="Acciones" style={{ textAlign: 'center' }}>
                    {tabActiva === 'espera' ? (
                      <button 
                        className="btn-primary" 
                        style={{ minHeight: '32px', height: '32px', padding: '0 var(--space-sm)', fontSize: '0.75rem' }}
                        disabled={estaProcesando}
                        onClick={() => handleCambiarEstadoLista(family.id_familia, 'PRINCIPAL')}
                      >
                        {estaProcesando ? '⏳ Procesando...' : 'Promover a Principal'}
                      </button>
                    ) : (
                      <button 
                        className="btn-table-action action-danger"
                        disabled={estaProcesando}
                        onClick={() => handleCambiarEstadoLista(family.id_familia, 'ESPERA')}
                      >
                        {estaProcesando ? '⏳ Procesando...' : 'Degradar a Espera'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

          </tbody>
        </table>
      </section>

    </div>
  );
}

export default Listas;