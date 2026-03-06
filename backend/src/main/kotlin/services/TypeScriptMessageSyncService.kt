package org.zetkin.lyra.backend.services

import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import org.zetkin.lyra.backend.logger
import org.zetkin.lyra.backend.plugins.git.LyraMessagesConfig
import org.zetkin.lyra.backend.plugins.ts.MessageIdsParser
import org.zetkin.lyra.backend.plugins.ts.TypeScriptMessageIdsUtils
import org.zetkin.lyra.backend.repositories.I18nKeyRepository
import org.zetkin.lyra.backend.repositories.PathRepository
import org.zetkin.lyra.backend.repositories.TranslationRepository
import java.nio.file.Path
import kotlin.io.path.absolutePathString
import kotlin.io.path.isDirectory

private const val MESSAGE_IDS_TS_FILENAME = "messageIds.ts"

private const val TS_FORMAT = "ts"

class TypeScriptMessageSyncService : MessageSyncService, KoinComponent {
    private val pathRepo: PathRepository by inject()
    private val i18nKeyRepo: I18nKeyRepository by inject()
    private val translationRepo: TranslationRepository by inject()
    private val parser = MessageIdsParser()
    private val log = logger()

    /**
     * Scans all messageIds.ts files under the project's messages directory,
     * parses them, and syncs the resulting paths and i18n keys to the database.
     *
     * @param projectId  DB ID of the project being synced.
     * @param projectDir Root of the project
     * @param messagesConfig  Messages section of .lyra.yaml (format + base path).
     */
    override fun sync(projectId: Int, projectDir: Path, messagesConfig: LyraMessagesConfig) {
        check(messagesConfig.format == TS_FORMAT) {
            "${javaClass.name} can only sync for message format '$TS_FORMAT'"
        }
        val messagesDir = projectDir.resolve(messagesConfig.path).normalize()
        check(messagesDir.isDirectory()) {
            "Cannot sync because configured path '$messagesDir' points not to a directory."
        }
        log.info("Syncing messages from $messagesDir")
        val messageFiles = findMessageFiles(messagesDir)
        messageFiles.forEach { log.debug(it.absolutePathString()) }
        val activePaths = messageFiles.map { projectDir.relativize(it).toString() }

        // Remove paths (and their keys) that no longer exist on disk
        transaction {
            val staleIds = pathRepo.findStaleIds(projectId, activePaths)
            if (staleIds.isNotEmpty()) {
                log.info("Found ${staleIds.size} stale paths within $messagesDir")
                translationRepo.deleteByKeyPaths(staleIds)
                i18nKeyRepo.deleteByPaths(staleIds)
                pathRepo.deleteByIds(staleIds)
            } else {
                log.info("All paths within ${messagesDir.toAbsolutePath()} are not stale.")
            }
        }
        var foundMessages = 0
        messageFiles.forEach { file ->
            val relativePath = projectDir.relativize(file).toString()
            val messages = TypeScriptMessageIdsUtils.parseMessageIds(file)
            log.debug("Found ${messages.size} messages within $relativePath:")
            foundMessages += messages.size
            messages.forEach { log.debug("\t${it.key}") }
            transaction {
                val pathId = pathRepo.findOrCreate(projectId, relativePath)
                messages.forEach {
                    i18nKeyRepo.upsert(projectId, pathId, it.key, it.defaultText, it.params)
                }
            }
        }
        log.info("Found $foundMessages messages in ${messageFiles.size} files")
    }

    private fun findMessageFiles(dir: Path): List<Path> {
        val results = mutableListOf<Path>()
        dir.toFile().walkTopDown().forEach { f ->
            if (f.isFile && f.name == MESSAGE_IDS_TS_FILENAME) {
                results.add(f.toPath())
            }
        }
        return results
    }
}
