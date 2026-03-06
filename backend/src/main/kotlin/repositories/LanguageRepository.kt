package org.zetkin.lyra.backend.repositories

import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.zetkin.lyra.backend.plugins.db.models.*

/** Manages persistence for languages associated with projects. */
class LanguageRepository {

    /** Returns `true` if [lang] is configured for [projectId]. */
    fun isLanguageSupported(projectId: Int, lang: String): Boolean = transaction {
        ProjectLangs.selectAll()
            .where { (ProjectLangs.project eq projectId) and (ProjectLangs.lang eq lang) }
            .any()
    }

    /**
     * Returns a map of language code → [LanguageDetails] for all languages configured for [projectId].
     *
     * Each entry includes the total message count for the project and the number of existing
     * translations for that language.
     */
    fun findByProjectId(projectId: Int): Map<String, LanguageDetails> = transaction {
        // Single JOIN query for lang codes + names (replaces N separate Langs selects)
        val langs = ProjectLangs
            .join(Langs, JoinType.INNER, ProjectLangs.lang, Langs.id)
            .selectAll()
            .where { ProjectLangs.project eq projectId }
            .map { it[Langs.id] to it[Langs.name] }

        buildMap {
            langs.forEach { (langCode, langName) ->
                val amountTranslations = Translations
                    .join(I18nKeys, JoinType.INNER, Translations.key, I18nKeys.id)
                    .selectAll()
                    .where { (I18nKeys.project eq projectId) and (Translations.lang eq langCode) }
                    .count()
                    .toInt()

                put(langCode, LanguageDetails(langName, amountTranslations))
            }
        }
    }
}
