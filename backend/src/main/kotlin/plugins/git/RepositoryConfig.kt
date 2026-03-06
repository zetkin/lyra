package org.zetkin.lyra.backend.plugins.git

import com.charleskorn.kaml.Yaml
import com.charleskorn.kaml.YamlConfiguration
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import java.io.File
import java.io.FileNotFoundException

private const val REPOSITORIES_CONFIG_FILE = "repositories.yaml"
private val yaml = Yaml(configuration = YamlConfiguration(strictMode = false))

fun loadRepositoriesConfig(): RepositoriesConfig {
    return try {
        // running as container this file is at the same level as the jar file
        yaml.decodeFromString(File(REPOSITORIES_CONFIG_FILE).readText())
    } catch (_: FileNotFoundException) {
        // running locally, that file sits in the root of the repository
        yaml.decodeFromString(File("../$REPOSITORIES_CONFIG_FILE").readText())
    }
}

@Serializable
data class RepositoryConfig(
    val name: String,
    @SerialName("base_branch") val baseBranch: String = "main",
    val owner: String,
    @SerialName("github_token") val githubToken: String,
    val host: String = "github.com",
) {
    val sshUrl: String get() = "git@$host:$owner/$name.git"
}

@Serializable
data class RepositoriesConfig(
    val repositories: List<RepositoryConfig>,
)
