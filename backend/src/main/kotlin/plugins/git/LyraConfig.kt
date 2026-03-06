package org.zetkin.lyra.backend.plugins.git

import com.charleskorn.kaml.Yaml
import com.charleskorn.kaml.YamlConfiguration
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import java.io.File

private val lyraYaml = Yaml(configuration = YamlConfiguration(strictMode = false))

fun parseLyraConfig(file: File): LyraConfig =
    lyraYaml.decodeFromString(file.readText())

@Serializable
data class LyraConfig(
    val version: Int,
    val projects: List<LyraProjectConfig>,
)

@Serializable
data class LyraProjectConfig(
    val path: String,
    val messages: LyraMessagesConfig,
    val translations: LyraTranslationsConfig,
    val languages: List<String>,
)

@Serializable
data class LyraMessagesConfig(
    val format: String,
    val path: String,
)

@Serializable
data class LyraTranslationsConfig(
    val path: String,
)
