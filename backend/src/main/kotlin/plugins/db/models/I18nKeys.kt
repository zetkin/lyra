package org.zetkin.lyra.backend.plugins.db.models

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.Table

@Serializable
data class I18nKey(
    val id: Int,
    val pathId: Int,
    val value: String,
    val defaultText: String,
    val params: String?,
)

fun ResultRow.toI18nKey() = I18nKey(
    id = this[I18nKeys.id],
    pathId = this[I18nKeys.path],
    value = this[I18nKeys.value],
    defaultText = this[I18nKeys.defaultText],
    params = this[I18nKeys.params],
)

object I18nKeys : Table("i18n_key") {
    val id = integer("id").autoIncrement()
    val path = reference("path", Paths.id)
    val project = reference("project", Projects.id)
    val value = text("value")
    val defaultText = text("default_text")
    val params = text("params").nullable()

    override val primaryKey = PrimaryKey(id)

    init {
        uniqueIndex(path, value)
    }
}
