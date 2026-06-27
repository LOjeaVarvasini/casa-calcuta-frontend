import { useState, useEffect, useCallback, useMemo } from 'react';
import { getFamiliasPrincipalesRequest, updateComisionFamiliaRequest } from '../../config/api.js';
import './comisiones.css';

function Comisiones({ onNavegar, parametros }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Datos reales del backend
  const [familias, setFamilias] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);

  // Cargar el padrón de familias activas principales
  const cargarFamilias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const respuesta = await getFamiliasPrincipalesRequest('per_page=100');
      const data = respuesta.data || [];

      // Filtramos solo las familias de la lista PRINCIPAL y activas
      let filtradas = data.filter(
        (f) => (f.estado_lista || '').toUpperCase() === 'PRINCIPAL' && f.activa === true
      );

      // Si venimos filtrados por ID desde otra pantalla
      if (parametros?.familiaId) {
        filtradas = filtradas.filter((f) => f.id_familia === parseInt(parametros.familiaId, 10));
      }

      setFamilias(filtradas);
    } catch (err) {
      setError(err.message || 'No se pudieron sincronizar las comisiones.');
    } finally {
      setLoading(false);
    }
  }, [parametros]);

  useEffect(() => {
    cargarFamilias();
  }, [cargarFamilias]);

  // Buscador reactivo en caliente
  const familiasFiltradas = useMemo(() => {
    const query = busqueda.toLowerCase().trim();
    if (!query) return familias;

    return familias.filter((f) => {
      const apellido = (f.referente?.apellido || '').toLowerCase();
      const nombre = (f.referente?.nombre || '').toLowerCase();
      return apellido.includes(query) || nombre.includes(query);
    });
  }, [familias, busqueda]);

  // Manejar el cambio automático de comisión en el select
  const handleComisionChange = async (familiaId, nuevaComision) => {
    try {
      // Impactamos directo en Laravel Cloud
      await updateComisionFamiliaRequest(familiaId, nuevaComision);

      // Actualizamos el estado local de inmediato para mantener consistencia visual
      setFamilias((prev) =>
        prev.map((f) =>
          f.id_familia === familiaId ? { ...f, prioridad_social: nuevaComision } : f
        )
      );
    } catch (err) {
      alert(err.message || 'No se pudo guardar el cambio de comisión.');
    }
  };

  const handleOpenHistory = (familia) => {
    setSelectedFamily(familia);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFamily(null);
  };

  // Navega de vuelta a la pantalla de origen (declarada por quien navegó hacia Comisiones).
  // Si no se especificó un "origen" en los parametros de navegacion, volvemos al dashboard por defecto.
  const handleVolver = () => {
    onNavegar(parametros?.origen || 'dashboard');
  };

  return (
    <div className="comisiones-module">

      {error && <div className="login-error comisiones-error-banner">{error}</div>}

      {/* CAJA INFORMATIVA */}
      <div className="info-profile-box comisiones-info-box">
        <p className="comisiones-info-text">
          💡 Las comisiones distribuyen las tareas obligatorias del merendero entre las familias beneficiarias de la Lista Principal. Los cambios en el selector se impactan automáticamente en el servidor cloud.
        </p>
      </div>

      {/* BARRA DE BÚSQUEDA + VOLVER */}
      <section className="page-toolbar comisiones-toolbar">
        <input
          type="text"
          placeholder="🔍 Buscar familia por apellido o referente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="form-control comisiones-search-input"
        />
        <button
          type="button"
          className="btn-primary comisiones-volver-btn"
          onClick={handleVolver}
        >
          ← Volver
        </button>
      </section>

      {loading && (
        <div className="comisiones-loading-state">
          Sincronizando asignación de comisiones...
        </div>
      )}

      {/* TABLA DE COMISIONES RESPONSIVE */}
      {!loading && !error && (
        <section className="table-responsive-container">
          <table className="custom-table custom-table-responsive">
            <thead>
              <tr>
                <th>Familia Beneficiaria</th>
                <th>Integrantes Mayores</th>
                <th>Comisión Actual</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {familiasFiltradas.length === 0 && (
                <tr>
                  <td colSpan="4" className="comisiones-empty-state">
                    No se encontraron registros que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
              {familiasFiltradas.map((f) => {
                const ref = f.referente || {};

                // Calculamos dinámicamente si hay datos de integrantes mayores, o dejamos 1 por defecto (el referente)
                const mayoresCount = f.puntaje_menores ? parseInt(f.puntaje_menores, 10) : 1;

                // Mapeamos el string de la comisión (usando prioridad_social o la prop que use Ignacio como placeholder provisional)
                // ⚠️ NOTA TÉCNICA: este mapeo pierde información. 'baja' -> cocina, 'media' -> ropero,
                // y CUALQUIER otro valor (incluyendo 'limpieza' real) cae en 'ninguna'. Revisar con backend
                // si 'comision_actual' debería ser un campo propio en vez de reusar 'prioridad_social'.
                const comisionActual = f.prioridad_social === 'baja' ? 'cocina' : f.prioridad_social === 'media' ? 'ropero' : 'ninguna';

                return (
                  <tr key={f.id_familia}>
                    <td data-label="Familia">
                      <strong>{ref.apellido || `Familia #${f.id_familia}`}</strong>
                      <p className="comisiones-ref-text">
                        Ref: {ref.nombre || '[Sin Nombre]'} {ref.apellido || ''}
                      </p>
                    </td>
                    <td data-label="Mayores">
                      {mayoresCount} Adulto{mayoresCount !== 1 ? 's' : ''}
                    </td>
                    <td data-label="Comisión">
                      <select
                        className="form-control select-comision"
                        value={comisionActual}
                        onChange={(e) => handleComisionChange(f.id_familia, e.target.value)}
                      >
                        <option value="cocina">🍳 Cocina y Porciones</option>
                        <option value="ropero">👕 Ropero Comunitario</option>
                        <option value="limpieza">🧹 Limpieza e Higiene</option>
                        <option value="ninguna">❌ Sin Asignar</option>
                      </select>
                    </td>
                    <td data-label="Acciones">
                      <div className="table-actions-cell">
                        <button
                          className="btn-table-action"
                          onClick={() => handleOpenHistory({ ...f, comisionActual, apellidoFamilia: ref.apellido, referente: `${ref.nombre} ${ref.apellido}` })}
                        >
                          Ver Historial
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* MODAL: HISTORIAL DE COMISIONES */}
      {isModalOpen && selectedFamily && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Historial de Asignaciones</h3>
            </div>
            <div className="modal-body">
              <p><strong>Familia:</strong> {selectedFamily.apellidoFamilia || 'Designada'}</p>
              <p><strong>Referente titular:</strong> {selectedFamily.referente}</p>
              <p>
                <strong>Estado actual:</strong> {
                  selectedFamily.comisionActual === 'cocina' ? '🍳 Cocina y Porciones' :
                  selectedFamily.comisionActual === 'ropero' ? '👕 Ropero Comunitario' :
                  selectedFamily.comisionActual === 'limpieza' ? '🧹 Limpieza e Higiene' : '❌ Sin Asignar'
                }
              </p>
              <hr className="comisiones-modal-divider" />

              {/* Pendiente de endpoint real de historial (no existe aún en api.js) */}
              <p className="comisiones-history-placeholder">
                📋 [Fecha]: [Estado Anterior] → [Estado Nuevo]
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-primary comisiones-modal-close-btn" onClick={handleCloseModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Comisiones;