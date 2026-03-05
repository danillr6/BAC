import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

function Resultados() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Recibimos los datos
  const { puntos, bebidasExtra } = location.state || { puntos: [], bebidasExtra: [] };

  // 1. LIMPIAR Y ORDENAR LAS HORAS
  const bebidasLimpias = (bebidasExtra || []).map(b => {
    const parts = (b.time || "00:00").split(':');
    const h = parts[0].padStart(2, '0');
    const m = (parts[1] || "00").padStart(2, '0');
    return { ...b, timeFmt: `${h}:${m}` };
  });

  const parseTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m; 
  };

  const startMins = bebidasLimpias.length > 0 ? parseTime(bebidasLimpias[0].timeFmt) : 0;

  // 2. CÁLCULO DE AIRE ESPIRADO Y HORAS
  const puntosCompletos = puntos.map(p => {
    let totalMins = startMins + p.minuto; 
    let h = Math.floor(totalMins / 60) % 24; 
    let m = totalMins % 60;
    return {
      ...p,
      hora_str: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
      brac: parseFloat((p.bac / 2).toFixed(4)) 
    };
  });

  // LÍMITES LEGALES
  const limiteNormalSangre = 0.5;
  const limiteNovelSangre = 0.3;
  const limiteNormalAire = 0.25;
  const limiteNovelAire = 0.15;

  // MÁXIMOS ESTIMADOS
  const bacMaximo = puntos.length > 0 ? Math.max(...puntos.map(p => p.bac)).toFixed(2) : "0.00";
  const bracMaximo = (parseFloat(bacMaximo) / 2).toFixed(2);

  // ESTADOS Y COLORES
  let mensajeEstado = "";
  let colorEstado = "";
  if (parseFloat(bacMaximo) >= limiteNormalSangre) {
    mensajeEstado = "⚠️ SUPERAS LA TASA MÁXIMA LEGAL";
    colorEstado = "#ff4d4d"; // Rojo Neón
  } else if (parseFloat(bacMaximo) >= limiteNovelSangre) {
    mensajeEstado = "🟡 SUPERAS LA TASA DE NOVEL";
    colorEstado = "#ffc107"; // Amarillo Neón
  } else {
    mensajeEstado = "✅ DENTRO DE LOS MÁRGENES LEGALES";
    colorEstado = "#00e676"; // Verde Neón
  }

  // --- ESTILOS CSS EN LÍNEA ---
  const styles = {
    container: {
      height: '100vh', 
      width: '100vw',
      backgroundColor: '#0b0d14', 
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      padding: '2vh 3vw',
      overflow: 'hidden', 
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    },
    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2vh',
      height: '8vh'
    },
    title: { margin: 0, fontSize: '2rem', color: '#fff', fontWeight: 'bold' },
    backBtn: {
      backgroundColor: '#1f2335', color: '#fff', border: '1px solid #333', 
      padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', 
      fontWeight: 'bold', transition: '0.3s', fontSize: '1rem'
    },
    summaryCard: {
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: '#161925',
      borderRadius: '12px',
      borderLeft: `6px solid ${colorEstado}`,
      padding: '1.5vh 2vw',
      marginBottom: '2vh',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      height: '15vh'
    },
    statBlock: { textAlign: 'center' },
    // NUEVO: Etiqueta clara de PICO MÁXIMO
    maxLabel: { fontSize: '0.85rem', color: '#8892b0', fontWeight: 'bold', letterSpacing: '1.5px', marginBottom: '5px', textTransform: 'uppercase' },
    statValue: { fontSize: '2.8rem', fontWeight: '900', color: colorEstado, margin: 0, lineHeight: '1.1' },
    statLabel: { fontSize: '1rem', color: '#8892b0', fontWeight: 'bold' },
    alertText: { fontSize: '1.2rem', fontWeight: 'bold', color: colorEstado, maxWidth: '280px', textAlign: 'right', lineHeight: '1.4' },
    chartsRow: {
      display: 'flex',
      flexDirection: 'row',
      gap: '2vw',
      flex: 1, 
      minHeight: 0 
    },
    chartCard: {
      flex: 1,
      backgroundColor: '#161925',
      borderRadius: '12px',
      padding: '2vh 2vw',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    },
    chartTitle: { textAlign: 'center', color: '#e2e8f0', margin: '0 0 2vh 0', fontSize: '1.2rem', fontWeight: '600' }
  };

  return (
    <div style={styles.container}>
      
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Resultados de Simulación</h1>
        <button 
          onClick={() => navigate('/')} 
          style={styles.backBtn}
          onMouseOver={(e) => e.target.style.backgroundColor = '#ff6b00'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#1f2335'}
        >
          🔄 Volver al Chat
        </button>
      </div>

      <div style={styles.summaryCard}>
        <div style={styles.statBlock}>
          {/* ETIQUETA AÑADIDA AQUÍ */}
          <div style={styles.maxLabel}>Pico Máximo en Sangre</div>
          <p style={styles.statValue}>{bacMaximo} <span style={styles.statLabel}>g/L</span></p>
        </div>
        
        <div style={{ width: '2px', height: '60%', backgroundColor: '#2a2f42' }}></div> 
        
        <div style={styles.statBlock}>
          {/* ETIQUETA AÑADIDA AQUÍ */}
          <div style={styles.maxLabel}>Pico Máximo en Aire</div>
          <p style={{...styles.statValue, color: '#00d2ff'}}>{bracMaximo} <span style={styles.statLabel}>mg/L</span></p>
        </div>

        <div style={styles.alertText}>{mensajeEstado}</div>
      </div>

      <div style={styles.chartsRow}>
        
        {/* GRÁFICA 1: SANGRE */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>🩸 Concentración en Sangre (g/L)</h3>
          {puntos.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={puntosCompletos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f42" />
                <XAxis dataKey="hora_str" minTickGap={30} tick={{ fill: '#8892b0', fontSize: 11 }} dy={10} />
                <YAxis tick={{ fill: '#8892b0', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0b0d14', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                
                <ReferenceLine y={limiteNormalSangre} stroke="#ff4d4d" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: 'Límite 0.50', fill: '#ff4d4d', fontSize: 11 }} />
                <ReferenceLine y={limiteNovelSangre} stroke="#ffc107" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: 'Novel 0.30', fill: '#ffc107', fontSize: 11 }} />

                {bebidasLimpias.map((b, index) => (
                  <ReferenceLine key={index} x={b.timeFmt} stroke="#8892b0" strokeWidth={1} strokeDasharray="3 3" />
                ))}

                <Line type="monotone" dataKey="bac" name="Sangre" stroke="#ff6b00" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#ff6b00', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ margin: 'auto', color: '#8892b0' }}>Sin datos</div>
          )}
        </div>

        {/* GRÁFICA 2: AIRE */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>💨 Alcohol en Aire Espirado (mg/L)</h3>
          {puntos.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={puntosCompletos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f42" />
                <XAxis dataKey="hora_str" minTickGap={30} tick={{ fill: '#8892b0', fontSize: 11 }} dy={10} />
                <YAxis tick={{ fill: '#8892b0', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0b0d14', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                
                <ReferenceLine y={limiteNormalAire} stroke="#ff4d4d" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: 'Límite 0.25', fill: '#ff4d4d', fontSize: 11 }} />
                <ReferenceLine y={limiteNovelAire} stroke="#ffc107" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: 'Novel 0.15', fill: '#ffc107', fontSize: 11 }} />

                {bebidasLimpias.map((b, index) => (
                  <ReferenceLine key={index} x={b.timeFmt} stroke="#8892b0" strokeWidth={1} strokeDasharray="3 3" />
                ))}

                <Line type="monotone" dataKey="brac" name="Aire" stroke="#00d2ff" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#00d2ff', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ margin: 'auto', color: '#8892b0' }}>Sin datos</div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Resultados;