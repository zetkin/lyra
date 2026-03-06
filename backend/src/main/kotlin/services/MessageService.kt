package org.zetkin.lyra.backend.services

import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import org.zetkin.lyra.backend.plugins.db.models.Message
import org.zetkin.lyra.backend.plugins.db.models.TranslationState
import org.zetkin.lyra.backend.repositories.I18nKeyRepository
import org.zetkin.lyra.backend.repositories.LanguageRepository
import org.zetkin.lyra.backend.repositories.ProjectRepository
import org.zetkin.lyra.backend.repositories.TranslationRepository

private fun Message.filterByState(state: TranslationState) =
    copy(translations = translations.filterValues { it.state == state })

class MessageService : KoinComponent {
    private val i18nKeyRepo: I18nKeyRepository by inject()
    private val projectRepo: ProjectRepository by inject()
    private val languageRepo: LanguageRepository by inject()
    private val translationRepo: TranslationRepository by inject()

    fun getMessages(
        projectId: Int,
        messageId: String?,
        stateFilter: TranslationState?,
        offset: Long,
        limit: Int,
        lang: String
    ): Pair<List<Message>, Int> {
        val (items, total) =
            i18nKeyRepo.findByProjectIdForAllLangs(
                projectId = projectId,
                offset = offset,
                limit = limit,
                messageId = messageId,
                lang = lang
            )
        return (if (stateFilter != null) items.map { it.filterByState(stateFilter) } else items) to total
    }

    fun searchMessages(
        projectId: Int,
        query: String,
        messageId: String?,
        stateFilter: TranslationState?,
        offset: Long,
        limit: Int,
        lang: String,
    ): Pair<List<Message>, Int> {
        val (items, total) = i18nKeyRepo.search(
            projectId = projectId,
            query = query,
            lang = lang,
            offset = offset,
            limit = limit,
            messageId = messageId,
        )
        return (if (stateFilter != null) items.map { it.filterByState(stateFilter) } else items) to total
    }

    fun getMessage(projectId: Int, i18nKey: String, lang: String?, stateFilter: TranslationState?): Message {
        val i18nKeyId = i18nKeyRepo.findIdByPathAndValue(projectId, i18nKey)
            ?: throw NoSuchElementException("i18n key '$i18nKey' not found")
        val message = (if (lang != null) {
            i18nKeyRepo.findByIdWithTranslation(i18nKeyId, lang)
        } else {
            i18nKeyRepo.findByI18nKeyIdWithAllTranslations(i18nKeyId)
        }) ?: throw NoSuchElementException("i18n key '$i18nKey' not found")
        return if (stateFilter != null) message.filterByState(stateFilter) else message
    }

    fun submitTranslation(projectId: Int, i18nKey: String, lang: String, text: String): Message {
        val project = projectRepo.findById(projectId)
        val i18nKeyId = i18nKeyRepo.findIdByPathAndValue(projectId, i18nKey)
            ?: throw NoSuchElementException("i18n key '$i18nKey' not found")
        if (!languageRepo.isLanguageSupported(project.id, lang)) {
            throw IllegalArgumentException("Language '$lang' is not supported for this project")
        }
        val missingParams = i18nKeyRepo.findParamsById(i18nKeyId).filter { !text.contains("{$it}") }
        if (missingParams.isNotEmpty()) {
            throw IllegalArgumentException(
                "Translation is missing required parameters: ${missingParams.joinToString(", ") { "{$it}" }}"
            )
        }
        translationRepo.upsert(i18nKeyId, lang, text, TranslationState.SUBMITTED)
        return i18nKeyRepo.findByIdWithTranslation(i18nKeyId, lang)
            ?: throw NoSuchElementException("i18n key '$i18nKey' not found")
    }
}
