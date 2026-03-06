package org.zetkin.lyra.backend

import org.slf4j.Logger
import org.slf4j.LoggerFactory

inline fun <reified T> T.logger(): Logger = LoggerFactory.getLogger(T::class.java)

fun configureLogging() {
    val debug = env("DEBUG")?.toBoolean() ?: false
    System.setProperty("org.slf4j.simpleLogger.defaultLogLevel", if (debug) "debug" else "info")

}
