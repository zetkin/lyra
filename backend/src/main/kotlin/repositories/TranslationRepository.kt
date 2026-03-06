package org.zetkin.lyra.backend.repositories

import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.upsert
import org.zetkin.lyra.backend.plugins.db.models.I18nKeys
import org.zetkin.lyra.backend.plugins.db.models.Paths
import org.zetkin.lyra.backend.plugins.db.models.Projects
import org.zetkin.lyra.backend.plugins.db.models.TranslationState
import org.zetkin.lyra.backend.plugins.db.models.Translations

data class SubmittedTranslation(
    val projectPath: String,
    val lang: String,
    val key: String,
    val text: String,
)

/** Manages persistence for translations of i18n keys. */
class TranslationRepository {

    /** Creates or updates a translation for [keyId] and [lang] with the given [text] and [state]. */
    fun upsert(keyId: Int, lang: String, text: String, state: TranslationState) = transaction {
        Translations.upsert(Translations.key, Translations.lang) {
            it[Translations.key] = keyId
            it[Translations.lang] = lang
            it[Translations.text] = text
            it[Translations.state] = state.name
        }
    }

    /** Deletes all translations for i18n keys belonging to the given [pathIds]. */
    fun deleteByKeyPaths(pathIds: List<Int>): Int = transaction {
        if (pathIds.isEmpty()) return@transaction 0
        val keyIds = I18nKeys.selectAll()
            .where { I18nKeys.path inList pathIds }
            .map { it[I18nKeys.id] }
        if (keyIds.isEmpty()) return@transaction 0
        Translations.deleteWhere { Translations.key inList keyIds }
    }

    /** Returns all [TranslationState.SUBMITTED] translations for the given repository. */
    fun findSubmittedByRepo(repoId: Int): List<SubmittedTranslation> = transaction {
        Translations
            .join(I18nKeys, JoinType.INNER, Translations.key, I18nKeys.id)
            .join(Projects, JoinType.INNER, I18nKeys.project, Projects.id)
            .selectAll()
            .where {
                (Projects.repoId eq repoId) and
                (Translations.state eq TranslationState.SUBMITTED.name)
            }
            .map { row ->
                SubmittedTranslation(
                    projectPath = row[Projects.projectPath],
                    lang = row[Translations.lang],
                    key = row[I18nKeys.value],
                    text = row[Translations.text],
                )
            }
    }

    /**
     * Deletes translations for [projectId] and [lang] whose keys are not in [presentKeyIds].
     *
     * Used during sync to remove translations for keys that no longer exist in the source files.
     */
    fun deleteStaleForProjectAndLang(projectId: Int, lang: String, presentKeyIds: Set<Int>): Int = transaction {
        val allProjectKeyIds = I18nKeys
            .join(Paths, JoinType.INNER, I18nKeys.path, Paths.id)
            .selectAll()
            .where { Paths.project eq projectId }
            .map { it[I18nKeys.id] }
            .toSet()

        val staleKeyIds = (allProjectKeyIds - presentKeyIds).toList()
        if (staleKeyIds.isEmpty()) return@transaction 0

        Translations.deleteWhere {
            (Translations.lang eq lang) and (Translations.key inList staleKeyIds)
        }
    }
}
