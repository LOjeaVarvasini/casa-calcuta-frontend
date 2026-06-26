import { useEffect, useMemo, useState } from 'react'
import './dashboard.css'
import {
  getCumpleanosProximosRequest,
  getNotificacionesRequest,
  marcarNotificacionVistaRequest,
} from '../../config/api.js'

function Dashboard({ onNavegar = () => {} }) {
  const [notificacionesCriticas, setNotificacionesCriticas] = useState([])
  const [cumpleanosProximos, setCumpleanosProximos] = useState([])
  const [cargandoNotificaciones, setCargandoNotificaciones] = useState(true)
  const [cargandoCumpleanos, setCargandoCumpleanos] = useState(true)

  const esNotificacionValida = (valor) => {
    return Boolean(
      valor &&
      typeof valor === 'object' &&
      !Array.isArray(valor) &&
      (
        'motivo' in valor ||
        'id' in valor ||
        'id_notificacion' in valor ||
        'notificacion_id' in valor
      )
    )
  }

  const extraerListaNotificaciones = (respuesta) => {
    const candidatos = [
      respuesta?.data?.data,
      respuesta?.data?.notifications,
      respuesta?.data,
      respuesta?.notifications,
      respuesta,
    ]

    for (const candidato of candidatos) {
      if (Array.isArray(candidato)) {
        return candidato
      }

      if (esNotificacionValida(candidato)) {
        return [candidato]
      }
    }

    return []
  }

  const obtenerTimestampNotificacion = (notificacion) => {
    const candidato =
      notificacion?.created_at ||
      notificacion?.fecha ||
      notificacion?.updated_at ||
      notificacion?.generated_at ||
      notificacion?.fecha_creacion

    const timestamp = candidato ? new Date(candidato).getTime() : 0
    return Number.isNaN(timestamp) ? 0 : timestamp
  }

  const formatearFechaCumple = (valor) => {
    if (!valor) {
      return ''
    }

    const fecha = new Date(valor)

    if (Number.isNaN(fecha.getTime())) {
      return valor
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(fecha)
  }

  const formatearFechaCumpleConDOW = (valor) => {
    if (!valor) {
      return ''
    }

    const fecha = new Date(valor)

    if (Number.isNaN(fecha.getTime())) {
      return valor
    }

    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(fecha)
  }

  const esCumpleanoValido = (valor) => {
    return Boolean(
      valor &&
      typeof valor === 'object' &&
      !Array.isArray(valor) &&
      (
        'nombre' in valor ||
        'apellido' in valor ||
        'integrante' in valor ||
        'fecha' in valor ||
        'edad' in valor
      )
    )
  }

  const extraerListaCumpleanos = (respuesta) => {
    const candidatos = [
      respuesta?.data?.data,
      respuesta?.data?.cumpleanos,
      respuesta?.data?.cumpleaños,
      respuesta?.data,
      respuesta?.cumpleanos,
      respuesta?.cumpleaños,
      respuesta,
    ]

    for (const candidato of candidatos) {
      if (Array.isArray(candidato)) {
        return candidato
      }

      if (esCumpleanoValido(candidato)) {
        return [candidato]
      }
    }

    return []
  }

  const obtenerNombreCumpleano = (cumpleano) => {
    const integrante = cumpleano?.integrante
    const nombre = integrante?.nombre || cumpleano?.nombre || ''
    const apellido = integrante?.apellido || cumpleano?.apellido || ''
    return `${nombre} ${apellido}`.trim() || cumpleano?.motivo || 'Integrante'
  }

  useEffect(() => {
    const cargarNotificaciones = async () => {
      setCargandoNotificaciones(true)

      try {
        const respuesta = await getNotificacionesRequest('per_page=15')
        const listaBruta = extraerListaNotificaciones(respuesta)

        const pendientes = listaBruta
          .map((notificacion, indice) => ({ notificacion, indice }))
          .filter(({ notificacion }) => notificacion?.vista !== true && notificacion?.visto !== true && notificacion?.leida !== true)
          .sort((a, b) => obtenerTimestampNotificacion(b.notificacion) - obtenerTimestampNotificacion(a.notificacion) || a.indice - b.indice)
          .map(({ notificacion }) => notificacion)

        setNotificacionesCriticas(pendientes)
      } catch {
        setNotificacionesCriticas([])
      } finally {
        setCargandoNotificaciones(false)
      }
    }

    cargarNotificaciones()
  }, [])

  useEffect(() => {
    const cargarCumpleanos = async () => {
      setCargandoCumpleanos(true)

      try {
        const respuesta = await getCumpleanosProximosRequest('dias=14')
        const listaBruta = extraerListaCumpleanos(respuesta)

        setCumpleanosProximos(listaBruta)
      } catch {
        setCumpleanosProximos([])
      } finally {
        setCargandoCumpleanos(false)
      }
    }

    cargarCumpleanos()
  }, [])

  const notificacionesVisibles = useMemo(() => notificacionesCriticas.slice(0, 15), [notificacionesCriticas])
  const mostrarBadge = notificacionesVisibles.length >= 2
  const cumpleanosVisibles = useMemo(() => cumpleanosProximos.slice(0, 15), [cumpleanosProximos])
  const proximoCumpleano = cumpleanosVisibles[0] || null
  const segundoCumpleano = cumpleanosVisibles[1] || null

  const nombreProximoCumpleano = proximoCumpleano ? obtenerNombreCumpleano(proximoCumpleano) : ''
  const edadProximoCumpleano = proximoCumpleano?.edad_a_cumplir || proximoCumpleano?.edad || proximoCumpleano?.anos || proximoCumpleano?.years || ''
  const diaProximoCumpleano = formatearFechaCumpleConDOW(
    proximoCumpleano?.fecha_cumple || proximoCumpleano?.dia || proximoCumpleano?.dia_semana || proximoCumpleano?.diaSemana || proximoCumpleano?.fecha || ''
  )
  const nombreSegundoCumpleano = segundoCumpleano ? obtenerNombreCumpleano(segundoCumpleano) : ''
  const edadSegundoCumpleano = segundoCumpleano?.edad_a_cumplir || segundoCumpleano?.edad || segundoCumpleano?.anos || segundoCumpleano?.years || ''
  const diaSegundoCumpleano = segundoCumpleano
    ? formatearFechaCumpleConDOW(
        segundoCumpleano?.fecha_cumple || segundoCumpleano?.dia || segundoCumpleano?.dia_semana || segundoCumpleano?.diaSemana || segundoCumpleano?.fecha || ''
      )
    : ''

  const handleMarcarVista = async (notificacion) => {
    const notificacionId = notificacion?.id ?? notificacion?.id_notificacion ?? notificacion?.notificacion_id

    if (!notificacionId) {
      return
    }

    try {
      await marcarNotificacionVistaRequest(notificacionId)
      setNotificacionesCriticas((prev) => prev.filter((item) => String(item?.id ?? item?.id_notificacion ?? item?.notificacion_id) !== String(notificacionId)))
    } catch {
      // Si falla el marcado, mantenemos la notificación visible.
    }
  }

  return (
    <div className="dashboard-view">

      {/* SECCIÓN DE ALERTAS ULTRA-RESPONSIVE */}
      <section className="dashboard-alerts-section">

        <div className="critical-alerts-column">
          {mostrarBadge && (
            <span className="critical-alerts-badge badge badge-danger">{notificacionesVisibles.length}</span>
          )}

          <div className="critical-alert-stack">
            {cargandoNotificaciones && (
              <div className="alert-card alert-danger alert-placeholder">
                <div className="alert-icon">⚠️</div>
                <div className="alert-body">
                  <div className="text-desktop">
                    <h3>Cargando notificaciones</h3>
                    <p>Estamos trayendo las alertas de ausentismo crítico.</p>
                  </div>
                  <div className="text-mobile">
                    <span className="alert-text-mini">Cargando alertas</span>
                  </div>
                </div>
              </div>
            )}

            {!cargandoNotificaciones && notificacionesVisibles.length === 0 && (
              <div className="alert-card alert-danger alert-placeholder">
                <div className="alert-icon">✅</div>
                <div className="alert-body">
                  <div className="text-desktop">
                    <h3>Sin alertas pendientes</h3>
                    <p>No hay notificaciones críticas para revisar.</p>
                  </div>
                  <div className="text-mobile">
                    <span className="alert-text-mini">Sin alertas pendientes</span>
                  </div>
                </div>
              </div>
            )}

            {!cargandoNotificaciones && notificacionesVisibles.map((notificacion) => {
              const notificacionId = notificacion?.id ?? notificacion?.id_notificacion ?? notificacion?.notificacion_id

              return (
                <div key={notificacionId} className="alert-card alert-danger alert-notification-card">
                  <div className="alert-icon">⚠️</div>
                  <div className="alert-body">
                    <div className="text-desktop">
                      <h3>Ausentismo Crítico Detectado</h3>
                      <p>{notificacion?.motivo || 'Notificación sin motivo'}</p>
                    </div>
                    <div className="text-mobile">
                      <span className="alert-text-mini">{notificacion?.motivo || 'Ausentismo Crítico'}</span>
                    </div>
                  </div>
                  <div className="alert-card-actions">
                    <a
                      href="#listas"
                      className="alert-action"
                      onClick={(e) => {
                        e.preventDefault()
                        onNavegar('listas')
                      }}
                    >
                      Gestionar
                    </a>
                    <button
                      type="button"
                      className="alert-view-button"
                      onClick={() => handleMarcarVista(notificacion)}
                      aria-label="Marcar notificación como vista"
                      title="Marcar como vista"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="alert-card alert-warning">
          <div className="alert-icon">🎂</div>
          <div className="alert-body birthday-alert-body">
            <div className="birthday-content">
              <div className="text-desktop">
                <h3>Próximos Cumpleaños (14 días)</h3>
                {cargandoCumpleanos ? (
                  <p>Cargando cumpleaños próximos...</p>
                ) : proximoCumpleano ? (
                  <p>
                    <strong>{nombreProximoCumpleano}</strong> cumple {edadProximoCumpleano || '?'} años el próximo {diaProximoCumpleano || '[Día de la semana]'}.
                    {segundoCumpleano && (
                      <>
                        {' '}
                        <strong>{nombreSegundoCumpleano}</strong> cumple {edadSegundoCumpleano || '?'} años el próximo {diaSegundoCumpleano || '[Día de la semana]'}.
                      </>
                    )}
                  </p>
                ) : (
                  <p>No hay cumpleaños dentro de los próximos 14 días.</p>
                )}
              </div>
              <div className="text-mobile">
                <span className="alert-text-mini">
                  {cargandoCumpleanos ? 'Cargando cumpleaños' : nombreProximoCumpleano || 'Cumpleaños Cercano'}
                </span>
              </div>
            </div>
          </div>
          <a href="#familias" className="alert-action" onClick={(e) => { e.preventDefault(); onNavegar('familias'); }}>
            Ver Agenda
          </a>
        </div>

      </section>

      {/* GRILLA DE INDICADORES / MÉTRICAS */}
      <section className="dashboard-grid">
        
        <div className="metric-card">
          <span className="card-icon">🍲</span>
          <div className="metric-data">
            <span className="metric-value">[Cant.]</span>
            <span className="metric-label">Porciones a Preparar</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="card-icon">👨‍👩‍👧‍👦</span>
          <div className="metric-data">
            <span className="metric-value">[Cant.]</span>
            <span className="metric-label">Familias Activas</span>
          </div>
        </div>

          <div className="metric-card">
            <span className="card-icon">⏳</span>
            <div className="metric-data">
              <span className="metric-value">[Cant.]</span>
              <span className="metric-label">Familias en Espera</span>
            </div>
          </div>

      </section>

    </div>
  );
}

export default Dashboard;
