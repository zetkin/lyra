package org.zetkin.lyra.backend.plugins.db.models

import org.jetbrains.exposed.v1.core.Table

object Translations : Table("translation") {
    val id = integer("id").autoIncrement()
    val key = reference("key", I18nKeys.id)
    val lang = reference("lang", Langs.id)
    val text = text("text")
    val state = text("state")
    val pullRequest = optReference("pull_request", PullRequests.id)

    override val primaryKey = PrimaryKey(id)

    init {
        uniqueIndex(key, lang)
    }
}
