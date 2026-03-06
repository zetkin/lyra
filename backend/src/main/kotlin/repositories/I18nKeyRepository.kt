package org.zetkin.lyra.backend.repositories

import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.upsert
import org.zetkin.lyra.backend.logger
import org.zetkin.lyra.backend.plugins.db.models.I18nKeys
import org.zetkin.lyra.backend.plugins.db.models.Message
import org.zetkin.lyra.backend.plugins.db.models.MessageTranslation
import org.zetkin.lyra.backend.plugins.db.models.TranslationState
import org.zetkin.lyra.backend.plugins.db.models.Paths
import org.zetkin.lyra.backend.plugins.db.models.Translations

/** Manages persistence for i18n keys and their associated messages. */
class I18nKeyRepository {

    private val log = logger()

    /** Creates or updates an i18n key record identified by [pathId] and [value]. */
    fun upsert(projectId: Int, pathId: Int, value: String, defaultText: String, params: List<String>) = transaction {
        I18nKeys.upsert(I18nKeys.path, I18nKeys.value) {
            it[I18nKeys.path] = pathId
            it[I18nKeys.value] = value
            it[I18nKeys.project] = projectId
            it[I18nKeys.defaultText] = defaultText
            it[I18nKeys.params] = params.joinToString(",").ifEmpty { null }
        }
    }

    /** Returns the number of distinct i18n key values in the given project. */
    fun count(projectId: Int): Long = transaction {
        val distinctCount = I18nKeys.value.countDistinct()
        I18nKeys.select(distinctCount)
            .where { I18nKeys.project eq projectId }
            .single()[distinctCount]
    }

    /**
     * Returns the ID of the i18n key matching [projectId] and [keyValue], or `null` if not found.
     *
     * If the key appears in multiple paths (ambiguous), logs a warning and returns the first match.
     */
    fun findIdByProjectAndValue(projectId: Int, keyValue: String): Int? = transaction {
        val results = I18nKeys
            .join(Paths, JoinType.INNER, I18nKeys.path, Paths.id)
            .selectAll()
            .where { (Paths.project eq projectId) and (I18nKeys.value eq keyValue) }
            .map { it[I18nKeys.id] to it[I18nKeys.path] }
        if (results.isEmpty()) {
            return@transaction null
        }
        if (results.size == 1) {
            return@transaction results.single().first
        }
        val pathForeignKeys = results.map { it.second }
        val paths = Paths.select(Paths.value).where {
            Paths.id inList pathForeignKeys
        }.map { it[Paths.value] }
        log.warn(
            "Ambiguous i18n key '$keyValue' in project $projectId:\nfound in ${results.size} paths:\n${
                paths.joinToString("\n")
            }"
        )
        log.error("Using first found i18n key (path ${paths[0]})")
        results[0].first
    }

    /** Returns a map of i18n key value → i18n key ID for all keys in the given project. */
    fun findKeyIdsByProject(projectId: Int): Map<String, Int> = transaction {
        val grouped = I18nKeys
            .join(Paths, JoinType.INNER, I18nKeys.path, Paths.id)
            .selectAll()
            .where { Paths.project eq projectId }
            .groupBy { it[I18nKeys.value] }

        val duplicates = grouped.filterValues { it.size > 1 }
        if (duplicates.isNotEmpty()) {
            val affectedFiles = duplicates.values
                .flatMap { rows -> rows.map { it[Paths.value] } }
                .distinct()
            log.warn(
                "Found ${duplicates.size} ambiguous i18n keys in project $projectId " +
                        "across ${affectedFiles.size} file(s):\n${affectedFiles.joinToString(",\n")}"
            )
            log.debug(
                "Ambiguous i18n keys in project $projectId:\n${duplicates.keys.joinToString(",\n")}"
            )
        }

        grouped.mapValues { (_, rows) -> rows.first()[I18nKeys.id] }
    }

    /** Returns the list of parameter names for the i18n key with the given [id]. */
    fun findParamsById(id: Int): List<String> = transaction {
        I18nKeys.select(I18nKeys.params)
            .where { I18nKeys.id eq id }
            .singleOrNull()
            ?.get(I18nKeys.params)
            ?.split(",")
            ?: emptyList()
    }

    /** Returns the ID of the i18n key matching [projectId] and [i18nKey] via a direct project-scoped lookup. */
    fun findIdByPathAndValue(projectId: Int, i18nKey: String): Int? = transaction {
        I18nKeys
            .select(I18nKeys.id)
            .where { (I18nKeys.project eq projectId) and (I18nKeys.value eq i18nKey) }
            .singleOrNull()
            ?.get(I18nKeys.id)
    }

    /**
     * Returns a paginated list of messages with the [lang] translation included, plus the total count.
     *
     * Results are ordered by translation text ascending (untranslated messages first).
     */
    fun findByProjectIdForLang(
        projectId: Int,
        lang: String,
        offset: Long,
        limit: Int,
        messageId: String?
    ): Pair<List<Message>, Int> =
        transaction {
            val total = I18nKeys.selectAll()
                .where { I18nKeys.project eq projectId }
                .count().toInt()

            val items = I18nKeys
                .join(Translations, JoinType.LEFT, I18nKeys.id, Translations.key) {
                    Translations.lang eq lang
                }
                .selectAll()
                .where {
                    val projectCondition = I18nKeys.project eq projectId
                    if (messageId != null) {
                        projectCondition and ((I18nKeys.value eq messageId) or (I18nKeys.value like "$messageId%"))
                    } else {
                        projectCondition
                    }
                }
                .orderBy(Translations.text to SortOrder.ASC_NULLS_FIRST)
                .limit(limit)
                .offset(offset)
                .map { it.toMessage() }

            items to total
        }

    /**
     * Returns a paginated list of messages with all translations included, plus the total count.
     *
     * Paginates by key ID, then fetches all translations for the selected keys in a single query.
     */
    fun findByProjectIdForAllLangs(
        projectId: Int,
        offset: Long,
        limit: Int,
        lang: String,
        messageId: String?
    ): Pair<List<Message>, Int> = transaction {
        val total = I18nKeys.selectAll()
            .where { I18nKeys.project eq projectId }
            .count().toInt()

        val keyIds = I18nKeys
            .join(Translations, JoinType.LEFT, I18nKeys.id, Translations.key) { Translations.lang eq lang }
            .select(I18nKeys.id)
            .where {
                val base = I18nKeys.project eq projectId
                if (messageId != null) base and ((I18nKeys.value eq messageId) or (I18nKeys.value like "$messageId%")) else base
            }
            .let { q ->
                if (messageId != null) q.orderBy(
                    Case().When(I18nKeys.value eq messageId, intLiteral(0)).Else(intLiteral(1)) to SortOrder.ASC,
                    Translations.id to SortOrder.ASC_NULLS_FIRST,
                    I18nKeys.id to SortOrder.ASC,
                ) else q.orderBy(Translations.id to SortOrder.ASC_NULLS_FIRST, I18nKeys.id to SortOrder.ASC)
            }
            .limit(limit).offset(offset)
            .map { it[I18nKeys.id] }

        if (keyIds.isEmpty()) return@transaction emptyList<Message>() to total

        val items = I18nKeys
            .join(Translations, JoinType.LEFT, I18nKeys.id, Translations.key)
            .selectAll()
            .where { I18nKeys.id inList keyIds }
            .toList()
            .groupBy { it[I18nKeys.id] }
            .values
            .map { rows -> rows.toMessage() }

        items to total
    }

    /**
     * Returns a paginated list of messages whose i18nKey, defaultText, or [lang] translation text
     * contains [query], plus the total count of matching messages.
     *
     * Items without a [lang] translation are sorted first.
     */
    fun search(
        projectId: Int,
        query: String,
        lang: String,
        offset: Long,
        limit: Int,
        messageId: String? = null,
    ): Pair<List<Message>, Int> = transaction {
        fun searchCondition() =
            (I18nKeys.project eq projectId) and (
                (I18nKeys.value like "%$query%") or
                (I18nKeys.defaultText like "%$query%") or
                (Translations.text like "%$query%")
            ) and (
                if (messageId != null) (I18nKeys.value eq messageId) or (I18nKeys.value like "$messageId%")
                else Op.TRUE
            )

        val total = I18nKeys
            .join(Translations, JoinType.LEFT, I18nKeys.id, Translations.key) { Translations.lang eq lang }
            .select(I18nKeys.id.countDistinct())
            .where { searchCondition() }
            .single()[I18nKeys.id.countDistinct()].toInt()

        val keyIds = I18nKeys
            .join(Translations, JoinType.LEFT, I18nKeys.id, Translations.key) { Translations.lang eq lang }
            .select(I18nKeys.id)
            .where { searchCondition() }
            .let { q ->
                if (messageId != null) q.orderBy(
                    Case().When(I18nKeys.value eq messageId, intLiteral(0)).Else(intLiteral(1)) to SortOrder.ASC,
                    Translations.id to SortOrder.ASC_NULLS_FIRST,
                    I18nKeys.id to SortOrder.ASC,
                ) else q.orderBy(Translations.id to SortOrder.ASC_NULLS_FIRST, I18nKeys.id to SortOrder.ASC)
            }
            .limit(limit).offset(offset)
            .map { it[I18nKeys.id] }

        if (keyIds.isEmpty()) return@transaction emptyList<Message>() to total

        val items = I18nKeys
            .join(Translations, JoinType.LEFT, I18nKeys.id, Translations.key)
            .selectAll()
            .where { I18nKeys.id inList keyIds }
            .toList()
            .groupBy { it[I18nKeys.id] }
            .values
            .map { rows -> rows.toMessage() }

        items to total
    }

    /** Returns the message for [i18nKeyId] with all available translations, or `null` if not found. */
    fun findByI18nKeyIdWithAllTranslations(i18nKeyId: Int): Message? = transaction {
        val rows = I18nKeys
            .join(Translations, JoinType.LEFT, I18nKeys.id, Translations.key)
            .selectAll()
            .where { I18nKeys.id eq i18nKeyId }
            .toList()
        if (rows.isEmpty()) return@transaction null
        rows.toMessage()
    }

    /** Returns the message for [i18nKeyId] with only the [lang] translation included, or `null` if not found. */
    fun findByIdWithTranslation(i18nKeyId: Int, lang: String): Message? = transaction {
        I18nKeys
            .join(Translations, JoinType.LEFT, I18nKeys.id, Translations.key) {
                Translations.lang eq lang
            }
            .selectAll()
            .where { I18nKeys.id eq i18nKeyId }
            .singleOrNull()
            ?.toMessage()
    }

    private fun List<ResultRow>.toMessage(): Message {
        val first = first()
        return Message(
            id = first[I18nKeys.id],
            i18nKey = first[I18nKeys.value],
            defaultText = first[I18nKeys.defaultText],
            params = first[I18nKeys.params]?.split(",") ?: emptyList(),
            projectId = first[I18nKeys.project],
            translations = mapNotNull { row ->
                row.getOrNull(Translations.text)?.let { text ->
                    row[Translations.lang] to MessageTranslation(
                        text,
                        row[Translations.lang],
                        TranslationState.valueOf(row[Translations.state])
                    )
                }
            }.toMap(),
        )
    }

    private fun ResultRow.toMessage() = Message(
        id = this[I18nKeys.id],
        i18nKey = this[I18nKeys.value],
        projectId = this[I18nKeys.project],
        defaultText = this[I18nKeys.defaultText],
        params = this[I18nKeys.params]?.split(",") ?: emptyList(),
        translations = this.getOrNull(Translations.text)?.let {
            mapOf(
                this[Translations.lang] to MessageTranslation(
                    it,
                    this[Translations.lang],
                    TranslationState.valueOf(this[Translations.state])
                )
            )
        } ?: emptyMap(),
    )

    /** Deletes all i18n keys belonging to the given [pathIds]. Returns 0 and logs a warning if empty. */
    fun deleteByPaths(pathIds: List<Int>): Int = transaction {
        if (pathIds.isEmpty()) {
            log.warn("Cannot delete any i18n keys when given list of paths is empty.")
            return@transaction 0
        }
        val deleted = I18nKeys.deleteWhere { I18nKeys.path inList pathIds }
        log.info("Deleted $deleted i18n keys from table")
        return@transaction deleted
    }

}
