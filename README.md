# 🍷 Simulador de Alcoholemia Inteligente

Un simulador avanzado de la concentración de alcohol en sangre (BAC) y aire espirado (BrAC). Utiliza inteligencia artificial para recopilar datos del usuario mediante voz o texto, y un modelo farmacocinético en el backend para generar curvas de metabolismo precisas.

## 🚀 Tecnologías Utilizadas

* **Frontend:** React.js, React Router, Recharts (para gráficas).
* **Backend:** Python, FastAPI / Uvicorn.
* **Inteligencia Artificial:** Google Gemini 1.5 Flash.
* **Voz:** Web Speech API.

## ⚙️ Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:
* [Node.js](https://nodejs.org/) (para ejecutar React)
* [Python 3.8+](https://www.python.org/) (para ejecutar el backend)
* Una clave API válida de Google Gemini (configurada en el archivo `App.js`).

## 🛠️ Instrucciones de Instalación y Ejecución

Para que el proyecto funcione correctamente, debes arrancar tanto el servidor Backend como el servidor Frontend al mismo tiempo en dos terminales distintas.

### 1. Iniciar el Backend (Python)
Abre una terminal en la carpeta de tu backend y ejecuta:
\`\`\`bash
# Instalar las dependencias (si no lo has hecho ya)
pip install fastapi uvicorn pydantic

# Arrancar el servidor
uvicorn logica:app --reload
\`\`\`
*El servidor backend se ejecutará en:* **`http://127.0.0.1:8000`**

### 2. Iniciar el Frontend (React)
Abre otra terminal en la carpeta de tu frontend y ejecuta:
\`\`\`bash
# Instalar los paquetes de Node
npm install

# Arrancar la aplicación web
npm start
\`\`\`

## 🌐 Rutas de la Aplicación

Una vez que ambos servidores estén corriendo, puedes acceder a la aplicación desde tu navegador:

* **Página Principal (Chat e IA):** [http://localhost:3000/](http://localhost:3000/)
* **Página de Resultados (Gráficas):** [http://localhost:3000/resultados](http://localhost:3000/resultados)

---
*Nota: Recuerda conceder permisos de micrófono en tu navegador si deseas utilizar la función de entrada por voz.*
