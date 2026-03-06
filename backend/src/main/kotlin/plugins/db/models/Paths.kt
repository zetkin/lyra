package org.zetkin.lyra.backend.plugins.db.models

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.Table

@Serializable
data class SourcePath(
    val id: Int,
    val projectId: Int,
    val value: String,
)

fun ResultRow.toSourcePath() = SourcePath(
    id = this[Paths.id],
    projectId = this[Paths.project],
    value = this[Paths.value],
)

object Paths : Table("path") {
    val id = integer("id").autoIncrement()
    val project = reference("project", Projects.id)
    val value = text("value")

    override val primaryKey = PrimaryKey(id)

    init {
        uniqueIndex(project, value)
    }
}
