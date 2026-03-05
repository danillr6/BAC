from datetime import datetime
from typing import List
from pydantic import BaseModel
from datetime import datetime, timedelta

# ==========================================
# 1. MODELOS DE DATOS
# ==========================================

class Bebida(BaseModel):
    hora_consumo: datetime
    mililitros: float
    porcentaje_alcohol: float  # Ejemplo: 5.0 para una cerveza estándar

class PerfilUsuario(BaseModel):
    sexo: str  # 'M' para masculino, 'F' para femenino
    edad: int
    peso: float  # en kilogramos
    altura: float  # en centímetros

# ==========================================
# 2. FUNCIONES BIOMÉTRICAS Y AUXILIARES
# ==========================================

def calcular_agua(usuario: PerfilUsuario) -> float:
    """
    Calcula el Agua Corporal Total (Total Body Water) en litros 
    utilizando las ecuaciones científicas de Watson.
    """
    if usuario.sexo == 'H':
        twb = 2.447 -(0.09156 * usuario.edad) + (0.1074 * usuario.altura) + (0.3362 * usuario.peso)
    elif usuario.sexo == 'F':
        twb = -2.097 + (0.1069 * usuario.altura) + (0.2466 * usuario.peso)
    else:
        twb = usuario.peso * 0.55
    
    return twb

    

def calcular_gramos_alcohol(bebida: Bebida) -> float:
    """
    Convierte el volumen y graduación alcohólica (ABV) en gramos puros de etanol.
    Densidad del etanol = ~0.789 g/ml a temperatura ambiente.
    """
    densidad_etanol = 0.789
    
    # Cálculo: Volumen * (% / 100) * Densidad
    gramos = bebida.mililitros * (bebida.porcentaje_alcohol / 100.0) * densidad_etanol
    
    return gramos


def obtener_minutos_ingesta(hora_inicial: datetime, lista_bebidas: List[Bebida]) -> List[int]:
    """
    Calcula cuántos minutos han pasado desde el inicio de la simulación
    para cada bebida consumida.
    """
    lista_minutos_relativos = []
    
    for bebida in lista_bebidas:
        # Restamos la hora de la bebida menos la hora en que empezó todo
        diferencia = bebida.hora_consumo - hora_inicial
        
        # Convertimos esa diferencia a minutos totales
        minutos_pasados = int(diferencia.total_seconds() / 60)
        
        # Guardamos el número en nuestra lista
        lista_minutos_relativos.append(minutos_pasados)
        
    return lista_minutos_relativos


def simulador_metabolismo(usuario: PerfilUsuario, bebidas: List[Bebida]) -> list:

    # 1. ORDENAMOS LAS BEBIDAS: Por si la IA las mandó desordenadas cronológicamente
    bebidas_ordenadas = sorted(bebidas, key=lambda b: b.hora_consumo)

    horaInicial = bebidas_ordenadas[0].hora_consumo
    horaUltima = bebidas_ordenadas[-1].hora_consumo
    
    # 2. TIEMPO DINÁMICO: La simulación termina 3 horas después de la ÚLTIMA bebida
    horaFinal = horaUltima + timedelta(hours=4)
    diferencia = horaFinal - horaInicial

    # Extraemos los minutos totales
    minutos_totales = int(diferencia.total_seconds() / 60)

    # 3. CALCULAMOS EL AGUA DEL USUARIO (Factor clave para el BAC)
    agua_cuerpo = calcular_agua(usuario)

    # Variables usadas (Manteniendo tus nombres)
    alchool_estomago = 0.0
    alchool_sangre = 0.0  # Representa gramos totales en sangre
    
    lista_minutos_relativos = obtener_minutos_ingesta(horaInicial, bebidas_ordenadas)
    contadorBebidas = 0
    
    # TASAS CORREGIDAS PARA REALISMO BIOLÓGICO
    tasaAbsorcion = 0.035  # 3.5% del alcohol del estómago pasa a la sangre por minuto
    
    # Convertimos la tasa de eliminación (0.15 g/L por hora) a gramos por minuto
    # Fórmula: (0.15 g/L * Litros de agua) / 60 minutos
    tasaMetabolizacion_gramos = (0.15 * agua_cuerpo) / 60

    historialBAC = []

    # Bucle principal de la simulacion
    for minuto in range(minutos_totales):

        # ¿Ha bebido algo en este minuto?
        for min_ingesta in lista_minutos_relativos:
            if minuto == min_ingesta:
                alchool_estomago += calcular_gramos_alcohol(bebidas_ordenadas[contadorBebidas])
                contadorBebidas += 1

        # 1. ABSORCIÓN: El alcohol pasa del estómago a la sangre
        traspaso = alchool_estomago * tasaAbsorcion
        alchool_sangre += traspaso
        alchool_estomago -= traspaso

        # 2. METABOLIZACIÓN: El hígado elimina el alcohol de la sangre
        alchool_sangre -= tasaMetabolizacion_gramos
        
        # 3. LÍMITES DE SEGURIDAD: El alcohol no puede ser negativo
        if alchool_sangre < 0:
            alchool_sangre = 0
        if alchool_estomago < 0.01:
            alchool_estomago = 0
        
        # 4. CÁLCULO DEL BAC EN ESTE MINUTO (Gramos / Litros de agua)
        BAC = alchool_sangre / agua_cuerpo
        
        historialBAC.append({
            "minuto": minuto,
            "bac": round(BAC, 4)
        })

    return historialBAC