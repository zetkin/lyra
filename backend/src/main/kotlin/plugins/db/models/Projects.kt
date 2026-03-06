package org.zetkin.lyra.backend.plugins.db.models

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.Table

@Serializable
data class Project(
    val id: Int,
    val repository: String,
    val projectPath: String,
    var messageCount: Long = 0L,
    var supportedLanguages: Map<String, LanguageDetails> = HashMap()
)

fun ResultRow.toProject() = Project(
    id = this[Projects.id],
    repository = this[Repos.name],
    projectPath = this[Projects.projectPath],
)

object Projects : Table("project") {
    val id = integer("id").autoIncrement()
    val repoId = reference("repo", Repos.id)
    val projectPath = text("project_path")

    override val primaryKey = PrimaryKey(id)

    init {
        uniqueIndex(repoId, projectPath)
    }
}
