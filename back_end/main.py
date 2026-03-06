from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from logica import PerfilUsuario, Bebida, simulador_metabolismo
from typing import List

app = FastAPI()

# Configuración de CORS corregida
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite que tu web de Vercel se conecte
    allow_credentials=True, # Añadido para evitar errores de seguridad
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/simular")
def post_simulacion(usuario: PerfilUsuario, bebidas: List[Bebida]):
    # Llamamos a tu función de lógica
    puntos_grafica = simulador_metabolismo(usuario, bebidas)
    return {"puntos": puntos_grafica}