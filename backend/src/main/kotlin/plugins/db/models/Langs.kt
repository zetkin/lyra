package org.zetkin.lyra.backend.plugins.db.models

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.Table

@Serializable
data class LanguageDetails(
    val name: String,
    val amountTranslations: Int
)


object Langs : Table("lang") {
    val id = text("id") // e.g., 'en', 'de'
    val name = text("name")

    override val primaryKey = PrimaryKey(id)
}
