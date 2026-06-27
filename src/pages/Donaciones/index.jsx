import { useState } from 'react'
import './donaciones.css'

function Donaciones({ onNavegar = () => {} }) {
  const [modalIngresoAbierto, setModalIngresoAbierto] = useState(false)
  const [modalAjusteAbierto, setModalAjusteAbierto] = useState(false)
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null)

  const abrirModalIngreso = () => setModalIngresoAbierto(true)
  const cerrarModalIngreso = () => setModalIngresoAbierto(false)

  const abrirModalAjuste = (insumo) => {
    setInsumoSeleccionado(insumo)
    setModalAjusteAbierto(true)
  }

  const cerrarModalAjuste = () => {
    setModalAjusteAbierto(false)
    setInsumoSeleccionado(null)
  }

  return (
    <div className="donaciones-view">

      {/* MICRO-TARJETAS DE INVENTARIO ALERTA (Stock Crítico) */}
      <section className="stock-alerts-grid">
        <div className="stock-alert-mini alert-danger-zone">
          <span className="stock-alert-icon">⚠️</span>
          <div className="stock-alert-text">
            <h4>[Nombre del Insumo]</h4>
            <p>Faltan: [Cantidad] [Unidad] (Stock Crítico)</p>
          </div>
        </div>
        <div className="stock-alert-mini alert-warning-zone">
          <span className="stock-alert-icon">⏳</span>
          <div className="stock-alert-text">
            <h4>[Nombre del Insumo]</h4>
            <p>Vencimiento cercano ([Cantidad de Días] días)</p>
          </div>
        </div>
      </section>

      {/* BARRA DE ACCIÓN SUPERIOR */}
      <section className="page-toolbar">
        <div className="search-filter-group">
          <div className="form-group" style={{ flex: 2 }}>
            <input type="search" id="inventory-search" placeholder="Buscar alimento o insumo..." />
          </div>
        </div>
        <button className="btn-primary" onClick={abrirModalIngreso}>➕ Registrar Ingreso</button>
      </section>

      {/* TABLA LÍQUIDA DE INGRESOS RECIENTES */}
      <section className="table-responsive-container">
        <table className="custom-table custom-table-responsive">
          <thead>
            <tr>
              <th>Insumo / Alimento</th>
              <th>Cantidad</th>
              <th>Categoría</th>
              <th>Fecha Ingreso</th>
              <th>Vencimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>

            {/* Fila 1 */}
            <tr>
              <td data-label="Insumo">
                <strong>[Nombre del Insumo]</strong>
              </td>
              <td data-label="Cantidad"><span className="stock-count">[Cantidad] [Unidad]</span></td>
              <td data-label="Categoría"><span className="badge badge-success">[Categoría]</span></td>
              <td data-label="Fecha Ingreso">[Fecha de Ingreso]</td>
              <td data-label="Vencimiento">[Fecha de Vencimiento]</td>
              <td data-label="Acciones">
                <button
                  className="btn-table-action"
                  onClick={() => abrirModalAjuste('[Nombre del Insumo]')}
                >
                  Ajustar
                </button>
              </td>
            </tr>

            {/* Fila 2 */}
            <tr>
              <td data-label="Insumo">
                <strong>[Nombre del Insumo]</strong>
              </td>
              <td data-label="Cantidad"><span className="stock-count">[Cantidad] [Unidad]</span></td>
              <td data-label="Categoría"><span className="badge badge-primary">[Categoría]</span></td>
              <td data-label="Fecha Ingreso">[Fecha de Ingreso]</td>
              <td data-label="Vencimiento"><span className="doc-pending">[Fecha de Vencimiento]</span></td>
              <td data-label="Acciones">
                <button
                  className="btn-table-action"
                  onClick={() => abrirModalAjuste('[Nombre del Insumo]')}
                >
                  Ajustar
                </button>
              </td>
            </tr>

          </tbody>
        </table>
      </section>

      {/* MODAL ESTÉTICO: REGISTRAR INGRESO */}
      {modalIngresoAbierto && (
        <div className="modal-overlay" onClick={cerrarModalIngreso}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={(e) => { e.preventDefault(); cerrarModalIngreso(); }}>
              <div className="modal-header">
                <h3>Registrar Ingreso de Donación</h3>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="ingreso-insumo">Insumo / Alimento</label>
                  <input type="text" id="ingreso-insumo" placeholder="[Nombre del Insumo]" />
                </div>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label htmlFor="ingreso-cantidad">Cantidad</label>
                    <input type="number" id="ingreso-cantidad" placeholder="[Cantidad]" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ingreso-unidad">Unidad</label>
                    <select id="ingreso-unidad">
                      <option value="">[Seleccionar Unidad]</option>
                      <option value="kg">Kg</option>
                      <option value="litros">Litros</option>
                      <option value="unidades">Unidades</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="ingreso-categoria">Categoría</label>
                    <select id="ingreso-categoria">
                      <option value="">[Seleccionar Categoría]</option>
                      <option value="frescos">Frescos</option>
                      <option value="secos">Secos</option>
                    </select>
                  </div>
                </div>
                <hr className="form-divider" />
                <div className="form-grid-3">
                  <div className="form-group">
                    <label htmlFor="ingreso-fecha">Fecha de Ingreso</label>
                    <input type="date" id="ingreso-fecha" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ingreso-vencimiento">Fecha de Vencimiento</label>
                    <input type="date" id="ingreso-vencimiento" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ingreso-origen">Origen / Donante</label>
                    <input type="text" id="ingreso-origen" placeholder="[Nombre del Donante]" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-table-action" onClick={cerrarModalIngreso}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Ingreso</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ESTÉTICO: AJUSTAR STOCK */}
      {modalAjusteAbierto && (
        <div className="modal-overlay" onClick={cerrarModalAjuste}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={(e) => { e.preventDefault(); cerrarModalAjuste(); }}>
              <div className="modal-header">
                <h3>Ajustar Stock: {insumoSeleccionado}</h3>
              </div>
              <div className="modal-body">
                <p className="ajuste-stock-actual">
                  Stock actual: <strong>[Cantidad Actual] [Unidad]</strong>
                </p>
                <div className="switch-toggle-group">
                  <div className="switch-toggle-item">
                    <input type="radio" id="ajuste-tipo-ingreso" name="ajuste-tipo" defaultChecked />
                    <label htmlFor="ajuste-tipo-ingreso">Sumar</label>
                  </div>
                  <div className="switch-toggle-item">
                    <input type="radio" id="ajuste-tipo-retirado" name="ajuste-tipo" />
                    <label htmlFor="ajuste-tipo-retirado">Restar</label>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="ajuste-cantidad">Cantidad a Ajustar</label>
                  <input type="number" id="ajuste-cantidad" placeholder="[Cantidad]" />
                </div>
                <div className="form-group">
                  <label htmlFor="ajuste-motivo">Motivo del Ajuste</label>
                  <textarea id="ajuste-motivo" rows="3" placeholder="[Motivo del ajuste, ej: merma, donación extra, etc.]"></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-table-action" onClick={cerrarModalAjuste}>Cancelar</button>
                <button type="submit" className="btn-primary">Confirmar Ajuste</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Donaciones