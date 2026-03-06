package org.zetkin.lyra.backend

import java.io.File
import java.lang.System.getenv

private val dotenv: Map<String, String> = File("../.env")
    .takeIf { it.exists() }
    ?.readLines()
    ?.filter { it.isNotBlank() && !it.startsWith("#") }
    ?.mapNotNull { line ->
        val eq = line.indexOf('=')
        if (eq < 0) return@mapNotNull null
        val key = line.substring(0, eq).trim()
        val value = line.substring(eq + 1).trim()
        key to value
    }
    ?.toMap()
    ?: emptyMap()

internal fun env(key: String): String? = getenv(key) ?: dotenv[key]
