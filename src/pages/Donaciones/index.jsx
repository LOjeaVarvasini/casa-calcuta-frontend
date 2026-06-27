import { useEffect, useState, useMemo } from 'react'
import './donaciones.css'
import {
  getDonacionesRequest,
  createDonacionRequest,
  updateDonacionRequest,
} from '../../config/api.js'

function Donaciones({ onNavegar = () => {}, session = null }) {
  const [donaciones, setDonaciones] = useState([])
  const [cargandoDonaciones, setCargandoDonaciones] = useState(true)
  const [errorCarga, setErrorCarga] = useState(null)
  
  // 🔍 ESTADO DEL BUSCADOR EN CALIENTE
  const [busqueda, setBusqueda] = useState('')

  const [modalIngresoAbierto, setModalIngresoAbierto] = useState(false)
  const [guardandoIngreso, setGuardandoIngreso] = useState(false)
  const [errorIngreso, setErrorIngreso] = useState(null)
  const [formIngreso, setFormIngreso] = useState({
    descripcion: '',
    cantidad: '',
    unidad_medida: '',
    origen: 'Donante',
    fecha_recepcion: '',
    familia_id: '',
  })

  const [modalAjusteAbierto, setModalAjusteAbierto] = useState(false)
  const [guardandoAjuste, setGuardandoAjuste] = useState(false)
  const [errorAjuste, setErrorAjuste] = useState(null)
  const [donacionSeleccionada, setDonacionSeleccionada] = useState(null)
  const [formAjuste, setFormAjuste] = useState({
    descripcion: '',
    cantidad: '',
    unidad_medida: '',
    origen: '',
    fecha_recepcion: '',
    familia_id: '',
  })

  const usuarioId = session?.user?.id_usuario

  const cargarDonaciones = async () => {
    setCargandoDonaciones(true)
    setErrorCarga(null)

    try {
      const respuesta = await getDonacionesRequest('per_page=100') // Levantamos un padrón amplio
      setDonaciones(respuesta?.data || [])
    } catch (err) {
      setErrorCarga(err.message || 'No se pudieron cargar las donaciones de la base de datos')
      setDonaciones([])
    } finally {
      setCargandoDonaciones(false)
    }
  }

  useEffect(() => {
    cargarDonaciones()
  }, [])

  // 📈 MÉTRICAS COMPUTADAS DINÁMICAS (Extraídas de la data real de la API)
  const metricasStock = useMemo(() => {
    // Buscamos insumos que tengan stock bajo o crítico (menos de 5 unidades/kg)
    const critico = donaciones.find(d => parseInt(f => d.cantidad, 10) <= 5);
    
    // Calculamos el volumen total almacenado en kilogramos líquidos de forma simbólica
    const totalKilos = donaciones
      .filter(d => d.unidad_medida === 'kg')
      .reduce((acc, d) => acc + (parseInt(d.cantidad, 10) || 0), 0);

    return {
      insumoCritico: critico ? `${critico.descripcion}` : 'Harina / Leche',
      cantidadCritica: critico ? `${critico.cantidad} ${critico.unidad_medida}` : 'Óptimo',
      totalAlmacenado: totalKilos || 0
    };
  }, [donaciones]);

  // 🔍 FILTRADO EN CALIENTE REACTIVO VIA UN INPUT
  const donacionesFiltradas = useMemo(() => {
    const query = busqueda.toLowerCase().trim();
    if (!query) return donaciones;

    return donaciones.filter((d) => {
      const insumo = (d.descripcion || '').toLowerCase();
      const donante = (d.origen || '').toLowerCase();
      return insumo.includes(query) || donante.includes(query);
    });
  }, [donaciones, busqueda]);

  const abrirModalIngreso = () => {
    setErrorIngreso(null)
    setFormIngreso({
      descripcion: '',
      cantidad: '',
      unidad_medida: '',
      origen: 'Donante',
      fecha_recepcion: new Date().toISOString().split('T')[0], // Clava la fecha de hoy por defecto
      familia_id: '',
    })
    setModalIngresoAbierto(true)
  }

  const cerrarModalIngreso = () => {
    setModalIngresoAbierto(false)
    setErrorIngreso(null)
  }

  const handleChangeIngreso = (campo, valor) => {
    setFormIngreso((prev) => ({ ...prev, [campo]: valor }))
  }

  const handleSubmitIngreso = async (e) => {
    e.preventDefault()
    setGuardandoIngreso(true)
    setErrorIngreso(null)

    // Sanitizamos el ID de familia: si está vacío, lo mandamos como null (no NaN)
    const familiaIdParseado = formIngreso.familia_id ? parseInt(formIngreso.familia_id, 10) : null;

    try {
      const payload = {
        origen: formIngreso.origen.trim(),
        descripcion: formIngreso.descripcion.trim(),
        cantidad: parseInt(formIngreso.cantidad, 10),
        unidad_medida: formIngreso.unidad_medida.toLowerCase().trim(),
        fecha: formIngreso.fecha_recepcion, // 🍏 Clave: Enlazado al campo fecha esperado por Ignacio
        fecha_recepcion: formIngreso.fecha_recepcion,
        registrado_por: usuarioId ? parseInt(usuarioId, 10) : 1, // Fallback seguro al Admin
        id_familia: familiaIdParseado,
        familia_id: familiaIdParseado, // Doble juego seguro anti-FormRequest
      }

      await createDonacionRequest(payload)
      await cargarDonaciones() // Sincroniza la grilla en caliente
      cerrarModalIngreso()
    } catch (err) {
      setErrorIngreso(err.message || 'Error de validación en el servidor (Verificá los campos).')
    } finally {
      setGuardandoIngreso(false)
    }
  }

  const abrirModalAjuste = (donacion) => {
    setErrorAjuste(null)
    setDonacionSeleccionada(donacion)
    setFormAjuste({
      descripcion: donacion.descripcion,
      cantidad: donacion.cantidad,
      unidad_medida: donacion.unidad_medida,
      origen: donacion.origen,
      fecha_recepcion: donacion.fecha_recepcion ? donacion.fecha_recepcion.split('T')[0] : '',
      familia_id: donacion.familia_id || '',
    })
    setModalAjusteAbierto(true)
  }

  const cerrarModalAjuste = () => {
    setModalAjusteAbierto(false)
    setDonacionSeleccionada(null)
    setErrorAjuste(null)
  }

  const handleChangeAjuste = (campo, valor) => {
    setFormAjuste((prev) => ({ ...prev, [campo]: valor }))
  }

  const handleSubmitAjuste = async (e) => {
    e.preventDefault()

    if (!donacionSeleccionada?.id_donacion) {
      setErrorAjuste('No se identificó el registro de donación a ajustar.')
      return
    }

    setGuardandoAjuste(true)
    setErrorAjuste(null)

    try {
      const payload = {
        origen: formAjuste.origen.trim(),
        descripcion: formAjuste.descripcion.trim(),
        cantidad: parseInt(formAjuste.cantidad, 10),
        unidad_medida: formAjuste.unidad_medida.toLowerCase().trim(),
        fecha_recepcion: formAjuste.fecha_recepcion,
        id_familia: formAjuste.familia_id ? parseInt(formAjuste.familia_id, 10) : null,
        familia_id: formAjuste.familia_id ? parseInt(formAjuste.familia_id, 10) : null,
      }

      await updateDonacionRequest(donacionSeleccionada.id_donacion, payload)
      await cargarDonaciones()
      cerrarModalAjuste()
    } catch (err) {
      setErrorAjuste(err.message || 'No se pudo registrar el ajuste.')
    } finally {
      setGuardandoAjuste(false)
    }
  }

  const formatearFecha = (valor) => {
    if (!valor) return 'No informada'
    const fecha = new Date(valor)
    if (Number.isNaN(fecha.getTime())) return valor
    return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(fecha)
  }

  return (
    <div className="donaciones-view" style={{ width: '100%' }}>

      {/* MICRO-TARJETAS DE INVENTARIO EN CALIENTE */}
      <section className="stock-alerts-grid">
        <div className="stock-alert-mini alert-danger-zone">
          <span className="stock-alert-icon">📦</span>
          <div className="stock-alert-text">
            <h4>Alerta de Inventario</h4>
            <p>Monitoreo: {metricasStock.insumoCritico} ({metricasStock.cantidadCritica})</p>
          </div>
        </div>
        <div className="stock-alert-mini alert-warning-zone">
          <span className="stock-alert-icon">📊</span>
          <div className="stock-alert-text">
            <h4>Reserva en Despensa</h4>
            <p>Volumen pesado: {metricasStock.totalAlmacenado} Kg Acumulados</p>
          </div>
        </div>
      </section>

      {/* BARRA DE ACCIÓN SUPERIOR */}
      <section className="page-toolbar" style={{ padding: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
        <div className="search-filter-group" style={{ flex: 1 }}>
          <input 
            type="search" 
            id="inventory-search" 
            placeholder="🔍 Buscar donación por insumo, alimento o donante..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="form-control"
            style={{ height: '40px', fontSize: 'var(--text-sm)' }}
          />
        </div>
        <button className="btn-primary" onClick={abrirModalIngreso} style={{ minHeight: '40px' }}>➕ Registrar Ingreso</button>
      </section>

      {errorCarga && <div className="login-error" style={{ marginBottom: 'var(--space-md)' }}>{errorCarga}</div>}

      {/* TABLA LÍQUIDA DE INGRESOS RECIENTES */}
      <section className="table-responsive-container">
        <table className="custom-table custom-table-responsive">
          <thead>
            <tr>
              <th>Insumo / Alimento</th>
              <th>Cantidad Disponible</th>
              <th>Origen / Canal</th>
              <th>Fecha Ingreso</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>

            {cargandoDonaciones && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--color-primary)', fontWeight: 600 }}>
                  Sincronizando inventario con el servidor cloud...
                </td>
              </tr>
            )}

            {!cargandoDonaciones && donaciones.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-md)', color: '#718096' }}>
                  No hay donaciones registradas en el servidor.
                </td>
              </tr>
            )}

            {!cargandoDonaciones && donacionesFiltradas.map((donacion) => (
              <tr key={donacion.id_donacion}>
                <td data-label="Insumo">
                  <strong style={{ color: 'var(--color-text)' }}>{donacion.descripcion}</strong>
                </td>
                <td data-label="Cantidad">
                  <span className="stock-count" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                    {donacion.cantidad} {donacion.unidad_medida}
                  </span>
                </td>
                <td data-label="Origen">
                  <span className="badge badge-primary" style={{ textTransform: 'none' }}>{donacion.origen}</span>
                </td>
                <td data-label="Fecha Ingreso">{formatearFecha(donacion.fecha_recepcion || donacion.fecha)}</td>
                <td data-label="Acciones" style={{ textAlign: 'center' }}>
                  <button
                    className="btn-table-action"
                    onClick={() => abrirModalAjuste(donacion)}
                    style={{ padding: '0.4rem 1rem' }}
                  >
                    Ajustar
                  </button>
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      </section>

      {/* MODAL: REGISTRAR INGRESO */}
      {modalIngresoAbierto && (
        <div className="modal-overlay" onClick={cerrarModalIngreso}>
          <div className="modal-box" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmitIngreso}>
              <div className="modal-header">
                <h3>Registrar Ingreso de Donación</h3>
              </div>
              <div className="modal-body">
                {errorIngreso && <div className="login-error" style={{ marginBottom: 'var(--space-md)' }}>{errorIngreso}</div>}
                
                <div className="form-group">
                  <label htmlFor="ingreso-descripcion">Insumo / Alimento</label>
                  <input
                    type="text"
                    id="ingreso-descripcion"
                    placeholder="Ej: Azúcar, Leche en polvo, Fideos"
                    value={formIngreso.descripcion}
                    onChange={(e) => handleChangeIngreso('descripcion', e.target.value)}
                    required
                  />
                </div>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label htmlFor="ingreso-cantidad">Cantidad</label>
                    <input
                      type="number"
                      id="ingreso-cantidad"
                      placeholder="Cantidad"
                      value={formIngreso.cantidad}
                      onChange={(e) => handleChangeIngreso('cantidad', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ingreso-unidad">Unidad</label>
                    <select
                      id="ingreso-unidad"
                      value={formIngreso.unidad_medida}
                      onChange={(e) => handleChangeIngreso('unidad_medida', e.target.value)}
                      required
                      style={{ height: '40px', cursor: 'pointer' }}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="kg">Kg</option>
                      <option value="litros">Litros</option>
                      <option value="unidad">Unidad</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="ingreso-origen">Canal de Origen</label>
                    <input
                      type="text"
                      id="ingreso-origen"
                      placeholder="Ej: Supermercado, Particular"
                      value={formIngreso.origen}
                      onChange={(e) => handleChangeIngreso('origen', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <hr className="form-divider" style={{ margin: 'var(--space-sm) 0' }} />
                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                  <div className="form-group">
                    <label htmlFor="ingreso-fecha">Fecha de Recepción</label>
                    <input
                      type="date"
                      id="ingreso-fecha"
                      value={formIngreso.fecha_recepcion}
                      onChange={(e) => handleChangeIngreso('fecha_recepcion', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ingreso-familia">ID Familia Vinculada (Opcional)</label>
                    <input
                      type="number"
                      id="ingreso-familia"
                      placeholder="ID en DB"
                      value={formIngreso.familia_id}
                      onChange={(e) => handleChangeIngreso('familia_id', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-table-action" onClick={cerrarModalIngreso} disabled={guardandoIngreso}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={guardandoIngreso}>
                  {guardandoIngreso ? 'Guardando...' : 'Guardar Ingreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTAR DONACIÓN */}
      {modalAjusteAbierto && (
        <div className="modal-overlay" onClick={cerrarModalAjuste}>
          <div className="modal-box" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmitAjuste}>
              <div className="modal-header">
                <h3>Ajustar Donación: {donacionSeleccionada?.descripcion}</h3>
              </div>
              <div className="modal-body">
                {errorAjuste && <div className="login-error" style={{ marginBottom: 'var(--space-md)' }}>{errorAjuste}</div>}
                
                <div className="form-group">
                  <label htmlFor="ajuste-descripcion">Insumo / Alimento</label>
                  <input
                    type="text"
                    id="ajuste-descripcion"
                    value={formAjuste.descripcion}
                    onChange={(e) => handleChangeAjuste('descripcion', e.target.value)}
                    required
                  />
                </div>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label htmlFor="ajuste-cantidad">Cantidad Actual en Despensa</label>
                    <input
                      type="number"
                      id="ajuste-cantidad"
                      value={formAjuste.cantidad}
                      onChange={(e) => handleChangeAjuste('cantidad', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ajuste-unidad">Unidad</label>
                    <select
                      id="ajuste-unidad"
                      value={formAjuste.unidad_medida}
                      onChange={(e) => handleChangeAjuste('unidad_medida', e.target.value)}
                      required
                      style={{ height: '40px', cursor: 'pointer' }}
                    >
                      <option value="kg">Kg</option>
                      <option value="litros">Litros</option>
                      <option value="unidad">Unidad</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="ajuste-origen">Canal / Procedencia</label>
                    <input
                      type="text"
                      id="ajuste-origen"
                      value={formAjuste.origen}
                      onChange={(e) => handleChangeAjuste('origen', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <hr className="form-divider" style={{ margin: 'var(--space-sm) 0' }} />
                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                  <div className="form-group">
                    <label htmlFor="ajuste-fecha">Fecha de Modificación</label>
                    <input
                      type="date"
                      id="ajuste-fecha"
                      value={formAjuste.fecha_recepcion}
                      onChange={(e) => handleChangeAjuste('fecha_recepcion', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ajuste-familia">ID Familia</label>
                    <input
                      type="number"
                      id="ajuste-familia"
                      value={formAjuste.familia_id}
                      onChange={(e) => handleChangeAjuste('familia_id', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-table-action" onClick={cerrarModalAjuste} disabled={guardandoAjuste}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={guardandoAjuste}>
                  {guardandoAjuste ? 'Guardando...' : 'Confirmar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Donaciones