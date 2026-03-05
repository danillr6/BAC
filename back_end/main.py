from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from logica import PerfilUsuario, Bebida, simulador_metabolismo
from typing import List

app = FastAPI()

# Esto permite que tu React se conecte a Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción pondríamos la URL de React
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/simular")
def post_simulacion(usuario: PerfilUsuario, bebidas: List[Bebida]):
    # Llamamos a tu función de lógica
    puntos_grafica = simulador_metabolismo(usuario, bebidas)
    return {"puntos": puntos_grafica}