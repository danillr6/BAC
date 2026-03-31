# Simulador Avanzado de Alcoholemia (BAC/BrAC)

Este proyecto es una aplicación web avanzada diseñada para calcular y simular la evolución de la Concentración de Alcohol en Sangre (BAC) y la Concentración de Alcohol en Aire Espirado (BrAC) a lo largo del tiempo. 

A diferencia de las calculadoras estándar basadas en fórmulas estáticas, este sistema implementa un modelo farmacocinético de un compartimento. Simula la absorción gástrica y la eliminación hepática de orden cero mediante un algoritmo iterativo, proporcionando resultados precisos respaldados por estándares de toxicología forense.

## Características Principales

* **Interfaz Conversacional Inteligente:** Integración con Google Gemini 1.5 Flash para extraer estructuradamente los datos del usuario (perfil fisiológico y patrón de consumo) a partir de lenguaje natural.
* **Entrada Multimodal:** Soporte para interacción mediante texto tradicional o reconocimiento de voz en tiempo real utilizando la Web Speech API.
* **Modelado Biológico:** Algoritmos backend que aplican la Ecuación de Watson para el cálculo del agua corporal total (TBW) y aplican tasas estandarizadas de absorción y metabolización.
* **Visualización de Datos Analíticos:** Gráficas interactivas que proyectan la curva de alcoholemia durante múltiples horas, marcando de forma clara los límites legales para la conducción.
* **Arquitectura Desacoplada:** Separación clara entre la lógica de presentación (Frontend) y el motor de cálculo matemático (Backend).

## Tecnologías Utilizadas

**Frontend:**
* React.js
* React Router (Gestión de estado y navegación)
* Recharts (Renderizado de gráficas vectoriales)
* Web Speech API

**Backend:**
* Python 3.8+
* FastAPI (Desarrollo de API RESTful)
* Uvicorn (Servidor ASGI)
* Pydantic (Validación de datos)

**Inteligencia Artificial:**
* Google Generative AI SDK (Modelo Gemini 1.5 Flash)

## Entorno de Producción

La interfaz principal de la aplicación se encuentra desplegada y accesible a través del siguiente enlace:

**URL de la Aplicación:** https://calculadora-alcohol-sangre.vercel.app/

*(Nota: Para el correcto funcionamiento de la aplicación web alojada en Vercel, el servidor backend de cálculo debe estar en ejecución y accesible desde el cliente, o debidamente desplegado en un servicio en la nube compatible).*

## Instrucciones para Entorno de Desarrollo Local

Para ejecutar el proyecto en una máquina local, es necesario iniciar los entornos de backend y frontend de manera simultánea en terminales separadas.

### 1. Configuración del Backend (Python)
Navegue hasta el directorio del backend y ejecute los siguientes comandos:

```bash
# Instalación de dependencias necesarias
pip install fastapi uvicorn pydantic

# Inicialización del servidor local
uvicorn logica:app --reload
