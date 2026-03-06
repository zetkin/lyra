package org.zetkin.lyra.backend.plugins.db.models

import org.jetbrains.exposed.v1.core.Table

object ProjectLangs : Table("project_lang") {
    val id = integer("id").autoIncrement()

    // The reference() function automatically creates Foreign Keys
    val project = reference("project", Projects.id)
    val lang = reference("lang", Langs.id)

    override val primaryKey = PrimaryKey(id)

    // Defining table-level constraints
    init {
        uniqueIndex(project, lang)
    }
}
