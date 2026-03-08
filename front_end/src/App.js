import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import Resultados from './Resultados'; // Importamos la nueva página

// LA CLAVE ESTA EN VERCEL
//Publica : 
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API;
//En local: const GEMINI_API_KEY = 'AIzaSyDs04kZR0plFHt0UKxhTiboJ_PwbAXHKZk';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- COMPONENTE PRINCIPAL DEL CHAT ---
// Ahora recibe el historial y los datos desde App para que no se borren al cambiar de pantalla
function ChatScreen({ chatHistory, setChatHistory, userData, setUserData }) {
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const isStoppedByButton = useRef(false);
  const navigate = useNavigate(); // Herramienta para saltar a la pagina de resultados

  // Scroll automático
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading, userData]);

  // Configuración de Voz
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; 
      recognitionRef.current.interimResults = false; 
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = ''; // Solo dejamos esta

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
          // El "else" ha desaparecido
        }

        if (finalTranscript !== '') {
          setInputText(prev => (prev + ' ' + finalTranscript).trim().replace(/\s\s+/g, ' '));
        }
      };

      recognitionRef.current.onend = () => {
        if (isStoppedByButton.current) {
            setIsRecording(false);
        } else {
            try { recognitionRef.current.start(); } catch (e) { console.error(e); }
        }
      };
    }
  }, []);

  // --- FUNCIÓN DE CÁLCULO (Conexión con Python y salto de página) ---
  const handleCalculateBAC = async () => {
    setIsLoading(true);
    try {
      const payload = {
        usuario: {
          sexo: userData.sex === "Hombre" ? "H" : "F",
          edad: parseInt(userData.age),
          peso: parseFloat(userData.weight),
          altura: parseFloat(userData.height)
        },
        bebidas: userData.drinks.map(d => ({
          hora_consumo: new Date(`${new Date().toISOString().split('T')[0]}T${d.time}:00`).toISOString(),
          mililitros: parseFloat(d.ml),
          // Enviamos 'porcentaje_alcohol' exactamente como lo espera Python
          porcentaje_alcohol: d.graduacion ? parseFloat(d.graduacion) : 5.0 
        }))
      };

      //URL Local: http://127.0.0.1:8000/simular
      //URL Publicab https://bac-vrdn.onrender.com/simular
      const response = await fetch('https://bac-vrdn.onrender.com/simular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.puntos && result.puntos.length > 0) {
        // Redirigimos pasándole los puntos Y la información de las bebidas
        navigate('/resultados', { 
          state: { 
            puntos: result.puntos, 
            bebidasExtra: userData.drinks, // Para pintar los iconos en la gráfica
            bebidasISO: payload.bebidas    // Para calcular la hora de inicio exacta
          } 
        });
      }
    } catch (error) {
      console.error("Error al conectar con Python:", error);
      alert("No se pudo conectar con el servidor de cálculo. ¿Está encendido el Uvicorn?");
    }
    setIsLoading(false);
  };

  // --- GENERADOR DE MENSAJE VISUAL ---
  const createSummaryMessage = (data) => {
    const drinksList = Array.isArray(data.drinks) 
      ? data.drinks.map(d => {
          const nombre = d.type || "Bebida";
          const cantidad = d.ml ? `${d.ml}ml` : "Cant. desconocida";
          const hora = d.time || "hora desconocida";
          const grado = d.graduacion ? `(${d.graduacion}%)` : ""; 
          
          return `- ${nombre} ${grado} de ${cantidad} a las ${hora}`;
        }).join('\n')
      : "No se especificaron bebidas";

    return `✅ ¡Datos guardados con éxito!
    
👤 PERFIL:
- Sexo: ${data.sex}
- Edad: ${data.age} años
- Peso: ${data.weight} kg
- Altura: ${data.height} cm

🍷 CONSUMO DETALLADO:
${drinksList}

(Pulsa el botón naranja de abajo para ver tu resultado)`;
  };

  const handleSendToAI = async (message) => {
    if (!message) return;

    // 1. LIMPIEZA: Eliminamos palabras repetidas consecutivas (típico error de móviles)
    const cleanMessage = message.split(' ').filter((w, i, a) => w !== a[i-1]).join(' ');

    // 2. ACTUALIZACIÓN VISUAL: Usamos el texto limpio en el chat
    const newHistory = [...chatHistory, { role: 'user', text: cleanMessage }];
    setChatHistory(newHistory);
    setIsLoading(true);
    setInputText("");

    try {
      // Configuramos el modelo (Asegúrate de que GEMINI_API_KEY esté bien definida arriba)
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", 
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      });

      // El System Prompt le dice a la IA cómo debe comportarse
      const systemPrompt = `
            Eres un experto en alcoholemia. Recopila: Sexo, Peso, Altura, Edad, Bebidas.
            
            REGLAS DE SEGURIDAD:
            1. Si el usuario menciona dos bebidas a la misma hora exacta, PREGUNTA antes de seguir: "¿Podrías decirme cuántos minutos pasaron entre la primera y la segunda?".
            2. Si no dan la graduación, usa estas por defecto: Cerveza: 5.0, Vino: 12.0, Copas: 40.0, Chupitos: 40.0.
            3. REGLA DEL CUBATA: Registro de 50ml al 40% (el resto es hielo/refresco).

            JSON FINAL (ESTRICTO): Responde SOLO con el JSON si los datos están completos. 
            {
              "completed": true,
              "sex": "Hombre/Mujer",
              "weight": 80,
              "height": 180,
              "age": 25,
              "drinks": [
                { "type": "Cerveza", "ml": 330, "graduacion": 5.0, "time": "22:00" }
              ]
            }
          `;

      // Preparamos el historial para la API
      const apiHistory = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Entendido. Generaré el JSON detallado cuando los datos estén completos." }] },
        ...newHistory.map(msg => ({ 
          role: msg.role === 'user' ? 'user' : 'model', 
          parts: [{ text: msg.text }] 
        }))
      ];

      const chat = model.startChat({ history: apiHistory });
      
      // 3. ENVÍO: Enviamos el mensaje LIMPIO a Gemini
      const result = await chat.sendMessage(cleanMessage); 
      const response = result.response.text();

      try {
        // Limpiamos la respuesta por si Gemini añade Markdown (```json)
        const cleanResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonStart = cleanResponse.indexOf('{');
        const jsonEnd = cleanResponse.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonStr = cleanResponse.substring(jsonStart, jsonEnd);
            const parsedData = JSON.parse(jsonStr);

            if (parsedData.completed) {
                setUserData(parsedData); 
                setChatHistory(prev => [...prev, { role: 'model', text: createSummaryMessage(parsedData) }]);
            } else {
                setChatHistory(prev => [...prev, { role: 'model', text: response }]);
            }
        } else {
            setChatHistory(prev => [...prev, { role: 'model', text: response }]);
        }
      } catch (e) {
        setChatHistory(prev => [...prev, { role: 'model', text: response }]);
      }

    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'model', text: "Error de conexión con Gemini." }]);
    }
    
    setIsLoading(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      isStoppedByButton.current = true;
      recognitionRef.current.stop();
      setIsRecording(false);
      setTimeout(() => handleSendToAI(inputText), 500);
    } else {
      isStoppedByButton.current = false;
      setInputText("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const submitText = (e) => {
    e.preventDefault();
    handleSendToAI(inputText);
  };

  return (
    <div className="container">
      <header>
        <h1>Control de Alcohol</h1>
      </header>

      <div className="chat-box">
        {chatHistory.length === 0 && (
           <div className="welcome-container">
              <p className="welcome-title">👋 Hola, para empezar indícame:</p>
              <div className="tags-grid">
                  <span className="tag-item"><i className="fas fa-venus-mars"></i> Sexo</span>
                  <span className="tag-item"><i className="fas fa-ruler-vertical"></i> Altura</span>
                  <span className="tag-item"><i className="fas fa-birthday-cake"></i> Edad</span>
                  <span className="tag-item"><i className="fas fa-weight"></i> Peso</span>
                  <span className="tag-item full"><i className="fas fa-wine-glass"></i> Bebidas y hora de consumo</span>
              </div>
           </div>
        )}
        
        {chatHistory.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
                <strong>{msg.role === 'user' ? 'Tú' : 'IA'}:</strong> 
                <span style={{ whiteSpace: 'pre-wrap', display: 'block', marginTop: '5px' }}>
                    {msg.text}
                </span>
            </div>
        ))}
        
        {isLoading && <p className="status-text">Escribiendo...</p>}
        <div ref={chatEndRef} />
      </div>

      <div className="input-area">
          {userData && (
            <button className="calculate-btn pulse-animation" onClick={handleCalculateBAC}>
              <i className="fas fa-calculator"></i> CALCULAR ALCOHOL EN SANGRE
            </button>
          )}

          <div className="controls-row">
            <div className="audio-section">
                <button className={`mic-button ${isRecording ? 'is-recording' : ''}`} onClick={toggleRecording}>
                <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
                </button>
            </div>

            <form onSubmit={submitText} className="input-section">
                <input 
                type="text" 
                className="text-input" 
                placeholder={isRecording ? "Escuchando... Pulsa micro para enviar" : "Escribe aquí..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                />
            </form>
          </div>
      </div>
    </div>
  );
}

// --- ENRUTADOR PRINCIPAL ---
function App() {
  // Los estados viven aquí para sobrevivir al cambio de página
  const [chatHistory, setChatHistory] = useState([]);
  const [userData, setUserData] = useState(null);

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <ChatScreen 
              chatHistory={chatHistory} 
              setChatHistory={setChatHistory} 
              userData={userData} 
              setUserData={setUserData} 
            />
          } 
        />
        <Route path="/resultados" element={<Resultados />} />
      </Routes>
    </Router>
  );
}

export default App;




// v2