package com.geoagent.app.util

object CodeGenerator {

    fun generateStationCode(existingCodes: List<String>, prefix: String = "EST"): String {
        val maxNumber = existingCodes
            .mapNotNull { code ->
                val regex = Regex("$prefix-(\\d+)")
                regex.find(code)?.groupValues?.get(1)?.toIntOrNull()
            }
            .maxOrNull() ?: 0

        return "$prefix-%03d".format(maxNumber + 1)
    }

    fun generateSampleCode(existingCodes: List<String>, prefix: String = "M"): String {
        val maxNumber = existingCodes
            .mapNotNull { code ->
                val regex = Regex("$prefix-(\\d+)")
                regex.find(code)?.groupValues?.get(1)?.toIntOrNull()
            }
            .maxOrNull() ?: 0

        return "$prefix-%03d".format(maxNumber + 1)
    }

    fun generateDrillHoleCode(existingCodes: List<String>, prefix: String = "DDH"): String {
        val maxNumber = existingCodes
            .mapNotNull { code ->
                val regex = Regex("$prefix-(\\d+)")
                regex.find(code)?.groupValues?.get(1)?.toIntOrNull()
            }
            .maxOrNull() ?: 0

        return "$prefix-%03d".format(maxNumber + 1)
    }
}
