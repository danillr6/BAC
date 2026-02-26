import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// TU CLAVE API
const API_KEY = "AIzaSyBVL6ZEsOLMdaRRqN7clyhpjWTWFBU5RpI"; 
const genAI = new GoogleGenerativeAI(API_KEY);

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const isStoppedByButton = useRef(false);

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
      recognitionRef.current.interimResults = true; 
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          finalTranscript += event.results[i][0].transcript;
        }
        setInputText(finalTranscript);
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

  // --- FUNCIÓN DE CÁLCULO (Aquí ya tendrás los ML limpios) ---
  const handleCalculateBAC = () => {
    // Ejemplo de cómo acceder a los mililitros ahora:
    // userData.drinks[0].ml  <-- Esto ya será un número (ej: 330)
    console.log("Datos para cálculo:", userData);
    alert(`Cálculo pendiente. Tienes ${userData.drinks.length} bebidas registradas.`);
  };

  // --- GENERADOR DE MENSAJE VISUAL ---
  const createSummaryMessage = (data) => {
    // Ahora leemos el OBJETO estructurado y lo convertimos a texto bonito
    const drinksList = Array.isArray(data.drinks) 
      ? data.drinks.map(d => {
          // Comprobamos si viene con el formato correcto
          const nombre = d.type || "Bebida";
          const cantidad = d.ml ? `${d.ml}ml` : "Cantidad desconocida";
          const hora = d.time || "hora desconocida";
          return `- ${nombre} de ${cantidad} a las ${hora}`;
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

    const newHistory = [...chatHistory, { role: 'user', text: message }];
    setChatHistory(newHistory);
    setIsLoading(true);
    setInputText("");

    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", 
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      });

      // --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE EN EL PROMPT ---
      const systemPrompt = `
        Eres un experto en alcoholemia. Recopila: Sexo, Peso, Altura, Edad, Bebidas.
        
        REGLAS:
        1. Revisa SIEMPRE el historial anterior.
        2. Pide lo que falta en lista con guiones.
        3. OBLIGATORIO: Si el usuario no dice cantidad exacta en ml, ASIGNA TÚ los ml estándar:
           - Cerveza = 330
           - Copa/Cubata = 50 (solo el alcohol)
           - Vino = 150
           - Chupito = 30
        
        4. JSON FINAL (ESTRICTO):
           Responde SOLO con este JSON cuando tengas todo.
           Las bebidas deben ser OBJETOS con "type", "ml" (NÚMERO) y "time".
           
           {
             "completed": true,
             "sex": "Hombre/Mujer",
             "weight": 80,
             "height": 180,
             "age": 25,
             "drinks": [
                { "type": "Cerveza", "ml": 330, "time": "22:00" },
                { "type": "Vino", "ml": 150, "time": "23:30" }
             ]
           }
      `;

      const apiHistory = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Entendido. Generaré el JSON con objetos detallados (ml numéricos) al final." }] },
        ...newHistory.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] }))
      ];

      const chat = model.startChat({ history: apiHistory });
      const result = await chat.sendMessage(message);
      const response = result.response.text();

      try {
        const cleanResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
        // Buscamos el inicio y fin del JSON para evitar texto basura
        const jsonStart = cleanResponse.indexOf('{');
        const jsonEnd = cleanResponse.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonStr = cleanResponse.substring(jsonStart, jsonEnd);
            const parsedData = JSON.parse(jsonStr);

            if (parsedData.completed) {
                setUserData(parsedData); 
                // Creamos el mensaje bonito nosotros mismos para evitar errores de React
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
      setChatHistory(prev => [...prev, { role: 'model', text: "Error de conexión." }]);
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

export default App;