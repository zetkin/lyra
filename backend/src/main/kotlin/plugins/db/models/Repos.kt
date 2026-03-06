package org.zetkin.lyra.backend.plugins.db.models

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.Table

@Serializable
data class Repo(
    val id: Int,
    val name: String,
    val baseBranch: String,
    val host: String,
    val owner: String,
)

fun ResultRow.toRepo() = Repo(
    id = this[Repos.id],
    name = this[Repos.name],
    baseBranch = this[Repos.baseBranch],
    host = this[Repos.host],
    owner = this[Repos.owner],
)

object Repos : Table("repository") {
    val id = integer("id").autoIncrement()
    val name = text("name")
    val baseBranch = text("base_branch")
    val host = text("host")
    val owner = text("owner")

    override val primaryKey = PrimaryKey(id)

    init {
        uniqueIndex(name)
    }
}
