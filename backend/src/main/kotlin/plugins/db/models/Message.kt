package org.zetkin.lyra.backend.plugins.db.models

import kotlinx.serialization.Serializable

@Serializable
data class Message(
    val id: Int,
    val projectId: Int,
    val i18nKey: String,
    val defaultText: String,
    val params: List<String>,
    val translations: Map<String, MessageTranslation>,
)

@Serializable
data class MessageTranslation(
    val text: String,
    val lang: String,
    val state: TranslationState,
)
