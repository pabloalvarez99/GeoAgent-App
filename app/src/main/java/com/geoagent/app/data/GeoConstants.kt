package com.geoagent.app.data

object GeoConstants {

    val rockGroups = listOf("Ignea", "Sedimentaria", "Metamorfica")

    val rockTypesByGroup = mapOf(
        "Ignea" to listOf(
            "Andesita", "Basalto", "Granito", "Diorita", "Riolita", "Dacita",
            "Gabro", "Granodiorita", "Tonalita", "Sienita", "Peridotita",
            "Porfido", "Toba", "Brecha Volcanica", "Ignimbrita"
        ),
        "Sedimentaria" to listOf(
            "Arenisca", "Lutita", "Caliza", "Conglomerado", "Limolita",
            "Dolomita", "Arcillolita", "Marga", "Evaporita", "Chert",
            "Fosforita", "Brecha Sedimentaria"
        ),
        "Metamorfica" to listOf(
            "Esquisto", "Gneis", "Marmol", "Pizarra", "Cuarcita",
            "Filita", "Anfibolita", "Migmatita", "Hornfels", "Skarn",
            "Serpentinita", "Milonita"
        ),
    )

    val colors = listOf(
        "Blanco", "Gris Claro", "Gris Medio", "Gris Oscuro", "Negro",
        "Rojo", "Rosado", "Cafe", "Cafe Claro", "Amarillo",
        "Verde", "Verde Oscuro", "Azul", "Violeta", "Naranja"
    )

    val textures = listOf(
        "Faneritica", "Afanitica", "Porfirica", "Vitrea",
        "Clastica", "Foliada", "Granoblastica", "Piroclastica"
    )

    val grainSizes = listOf("Muy Fina", "Fina", "Media", "Gruesa", "Muy Gruesa")

    val alterations = listOf(
        "Ninguna", "Filica", "Argilica", "Argilica Avanzada",
        "Propilitica", "Potasica", "Silicica", "Clorita-Epidota",
        "Carbonatacion", "Sericitizacion", "Turmalina"
    )

    val alterationIntensities = listOf("Debil", "Moderada", "Fuerte", "Intensa", "Pervasiva")

    val structures = listOf(
        "Masiva", "Foliada", "Bandeada", "Brechada",
        "Vesicular", "Amigdaloidal", "Fluidal", "Estratificada",
        "Laminada", "Cizallada"
    )

    val weatheringGrades = listOf("Fresca", "Leve", "Moderada", "Alta", "Muy Alta", "Suelo Residual")

    val structuralTypes = listOf(
        "Falla", "Fractura", "Veta", "Vetilla",
        "Foliacion", "Estratificacion", "Contacto",
        "Diaclasa", "Clivaje", "Zona de Cizalle"
    )

    val dipDirections = listOf("N", "NE", "E", "SE", "S", "SW", "W", "NW")

    val faultMovements = listOf("Normal", "Inversa", "Dextral", "Sinistral", "Oblicua")

    val roughness = listOf("Lisa", "Rugosa", "Escalonada", "Ondulada", "Estriada")

    val continuity = listOf("Continua", "Discontinua", "Intermitente")

    val sampleTypes = listOf("Roca", "Suelo", "Sedimento", "Canal", "Chip", "Trinchera", "Panel")

    val drillHoleTypes = listOf("Diamantina", "RC", "Aire Reverso", "Percusion")

    val drillHoleStatuses = listOf("En Progreso", "Completado", "Abandonado", "Suspendido")

    val weatherConditions = listOf("Despejado", "Nublado", "Parcial", "Lluvia", "Nieve", "Viento", "Niebla")

    val commonMinerals = listOf(
        "Cuarzo", "Feldespato", "Plagioclasa", "Biotita", "Moscovita",
        "Hornblenda", "Augita", "Olivino", "Calcita", "Dolomita",
        "Pirita", "Calcopirita", "Molibdenita", "Magnetita", "Hematita",
        "Galena", "Esfalerita", "Arsenopirita", "Bornita", "Covelina",
        "Clorita", "Epidota", "Sericita", "Arcilla", "Turmalina",
        "Granate", "Actinolita", "Wollastonita", "Fluorita"
    )
}
