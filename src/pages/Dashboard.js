import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Cell
} from 'recharts';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const [movimientos, setMovimientos] = useState([]);
  const [resumen, setResumen] = useState({ ingresos: 0, egresos: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para el formulario de nuevo movimiento
  const [tipo, setTipo] = useState('ingreso');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Estado para edición
  const [editMode, setEditMode] = useState(false);
  const [currentMovimiento, setCurrentMovimiento] = useState(null);

  // Estados para filtros
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [movimientosFiltrados, setMovimientosFiltrados] = useState([]);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData();
  }, []);

  // Función para cargar los datos
  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Obtener movimientos
      const movimientosResponse = await axios.get('/api/movimientos');
      setMovimientos(movimientosResponse.data.movimientos);
      
      // Obtener resumen
      const resumenResponse = await axios.get('/api/movimientos/resumen');
      setResumen(resumenResponse.data.resumen);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    
    try {
      // Validar monto
      const montoNum = parseFloat(monto);
      if (isNaN(montoNum) || montoNum <= 0) {
        setFormError('El monto debe ser un número positivo');
        return;
      }
      
      if (editMode && currentMovimiento) {
        // Actualizar movimiento existente
        await axios.put(`/api/movimientos/${currentMovimiento.id}`, {
          tipo,
          monto: montoNum,
          descripcion
        });
      } else {
        // Crear nuevo movimiento
        await axios.post('/api/movimientos', {
          tipo,
          monto: montoNum,
          descripcion
        });
      }
      
      // Limpiar formulario y salir del modo edición
      resetForm();
      
      // Recargar datos
      fetchData();
    } catch (err) {
      console.error('Error al procesar movimiento:', err);
      setFormError(err.response?.data?.error || 'Error al procesar el movimiento');
    } finally {
      setFormLoading(false);
    }
  };

  // Función para eliminar un movimiento
  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro que desea eliminar este movimiento? Esta acción no se puede deshacer.')) {
      try {
        await axios.delete(`/api/movimientos/${id}`);
        
        // Si el movimiento que se está eliminando es el que se está editando,
        // resetear el formulario
        if (currentMovimiento && currentMovimiento.id === id) {
          resetForm();
        }
        
        fetchData(); // Recargar datos después de eliminar
      } catch (err) {
        console.error('Error al eliminar movimiento:', err);
        setError('Error al eliminar el movimiento');
      }
    }
  };

  // Función para editar un movimiento
  const handleEdit = (movimiento) => {
    setCurrentMovimiento(movimiento);
    setTipo(movimiento.tipo);
    // Convertir el monto a entero para eliminar los decimales
    setMonto(parseInt(movimiento.monto));
    setDescripcion(movimiento.descripcion || '');
    setEditMode(true);
    
    // Desplazar hacia el formulario
    document.getElementById('movimientoForm').scrollIntoView({ behavior: 'smooth' });
  };

  // Función para cancelar la edición
  const resetForm = () => {
    setEditMode(false);
    setCurrentMovimiento(null);
    setTipo('ingreso');
    setMonto('');
    setDescripcion('');
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear moneda en Gs (Guaraníes)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Aplicar filtros a los movimientos
  const aplicarFiltros = () => {
    let resultado = [...movimientos];
    
    // Filtrar por tipo
    if (filtroTipo !== 'todos') {
      resultado = resultado.filter(mov => mov.tipo === filtroTipo);
    }
    
    // Filtrar por fecha desde
    if (filtroFechaDesde) {
      const fechaDesde = new Date(filtroFechaDesde);
      fechaDesde.setHours(0, 0, 0, 0);
      resultado = resultado.filter(mov => new Date(mov.fecha) >= fechaDesde);
    }
    
    // Filtrar por fecha hasta
    if (filtroFechaHasta) {
      const fechaHasta = new Date(filtroFechaHasta);
      fechaHasta.setHours(23, 59, 59, 999);
      resultado = resultado.filter(mov => new Date(mov.fecha) <= fechaHasta);
    }
    
    setMovimientosFiltrados(resultado);
  };

  // Efecto para aplicar filtros cuando cambian los criterios o los movimientos
  useEffect(() => {
    aplicarFiltros();
  }, [filtroFechaDesde, filtroFechaHasta, filtroTipo, movimientos]);

  // Preparar datos para gráficos
  const prepareChartData = () => {
    // Datos para el gráfico de distribución (Pie Chart)
    const distributionData = [
      { name: 'Ingresos', value: resumen.ingresos },
      { name: 'Egresos', value: Math.abs(resumen.egresos) }
    ];

    // Datos para el gráfico de movimientos recientes (Bar Chart)
    const recentMovements = [...movimientos]
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 5)
      .map(mov => ({
        fecha: formatDate(mov.fecha).split(',')[0],
        monto: mov.tipo === 'ingreso' ? parseFloat(mov.monto) : -parseFloat(mov.monto)
      }));

    // Agrupar movimientos por fecha para el gráfico de línea
    const movimientosPorFecha = movimientos.reduce((acc, mov) => {
      const fecha = new Date(mov.fecha).toLocaleDateString('es-ES');
      if (!acc[fecha]) {
        acc[fecha] = { fecha, ingresos: 0, egresos: 0 };
      }
      
      if (mov.tipo === 'ingreso') {
        acc[fecha].ingresos += parseFloat(mov.monto);
      } else {
        acc[fecha].egresos += parseFloat(mov.monto);
      }
      
      return acc;
    }, {});

    const timelineData = Object.values(movimientosPorFecha)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    return { distributionData, recentMovements, timelineData };
  };

  // Colores para los gráficos
  const COLORS = ['#28a745', '#dc3545'];

  // Obtener datos para los gráficos
  const { distributionData, recentMovements, timelineData } = prepareChartData();

  return (
    <div className="dashboard-container">
      <div className="header">
        <h1>Dashboard Financiero</h1>
        <div className="user-welcome">
          <span className="welcome-text">Bienvenido, {user?.nombre || user?.email}</span>
          <button onClick={logout} className="logout-btn">Cerrar Sesión</button>
        </div>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <>
          {/* Resumen financiero */}
          <div className="resumen-cards">
            <div className="card">
              <h3>Ingresos</h3>
              <p className="amount positive">{formatCurrency(resumen.ingresos)}</p>
            </div>
            <div className="card">
              <h3>Egresos</h3>
              <p className="amount negative">{formatCurrency(resumen.egresos)}</p>
            </div>
            <div className="card">
              <h3>Balance</h3>
              <p className={`amount ${resumen.balance >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(resumen.balance)}
              </p>
            </div>
          </div>
          
          {/* Gráficos estadísticos */}
          <div className="charts-container">
            {/* Gráfico de distribución (Pie Chart) */}
            <div className="chart-card">
              <h3>Distribución de Finanzas</h3>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Gráfico de movimientos recientes (Bar Chart) */}
            <div className="chart-card">
              <h3>Movimientos Recientes</h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={recentMovements}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="monto" fill="#370C2A" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Gráfico de línea temporal (Line Chart) */}
            <div className="chart-card">
              <h3>Evolución Temporal</h3>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="ingresos" stroke="#28a745" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="egresos" stroke="#dc3545" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Formulario para nuevo/editar movimiento */}
          <div className="card mt-4" id="movimientoForm">
            <h2>{editMode ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h2>
            
            {formError && <div className="alert alert-danger">{formError}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="tipo">Tipo</label>
                <select
                  id="tipo"
                  className="form-control"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="monto">Monto (Gs)</label>
                <input
                  type="number"
                  id="monto"
                  className="form-control"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  step="1"
                  min="1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="descripcion">Descripción (opcional)</label>
                <input
                  type="text"
                  id="descripcion"
                  className="form-control"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
              
              <div className="form-buttons">
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={formLoading}
                >
                  {formLoading ? 'Procesando...' : (editMode ? 'Guardar Cambios' : 'Agregar Movimiento')}
                </button>
                
                {editMode && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={resetForm}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
          
          {/* Tabla de movimientos */}
          <div className="mt-4">
            <h2>Historial de Movimientos</h2>
            
            {/* Filtros */}
            <div className="filtros-container">
              <div className="filtro-grupo">
                <label>Fecha desde:</label>
                <input 
                  type="date" 
                  className="filtro-input" 
                  value={filtroFechaDesde}
                  onChange={(e) => setFiltroFechaDesde(e.target.value)}
                />
              </div>
              
              <div className="filtro-grupo">
                <label>Fecha hasta:</label>
                <input 
                  type="date" 
                  className="filtro-input" 
                  value={filtroFechaHasta}
                  onChange={(e) => setFiltroFechaHasta(e.target.value)}
                />
              </div>
              
              <div className="filtro-grupo">
                <label>Tipo:</label>
                <select 
                  className="filtro-input" 
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="ingreso">Ingresos</option>
                  <option value="egreso">Egresos</option>
                </select>
              </div>
            </div>
            
            {movimientosFiltrados.length === 0 ? (
              <p>No hay movimientos que coincidan con los filtros seleccionados o aún no se ha registrado ninguno.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosFiltrados.map((movimiento) => (
                    <tr key={movimiento.id}>
                      <td data-label="Fecha">{formatDate(movimiento.fecha)}</td>
                      <td data-label="Tipo">
                        <span className={movimiento.tipo === 'ingreso' ? 'badge-success' : 'badge-danger'}>
                          {movimiento.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td data-label="Monto">{formatCurrency(parseFloat(movimiento.monto))}</td>
                      <td data-label="Descripción">{movimiento.descripcion || '-'}</td>
                      <td data-label="Acciones">
                        <div className="action-buttons">
                          <button 
                            className="btn btn-sm btn-info" 
                            onClick={() => handleEdit(movimiento)}
                          >
                            Editar
                          </button>
                          <button 
                            className="btn btn-sm btn-danger" 
                            onClick={() => handleDelete(movimiento.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;