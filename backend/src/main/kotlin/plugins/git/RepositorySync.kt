package org.zetkin.lyra.backend.plugins.git

import io.ktor.server.application.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.koin.ktor.ext.inject
import org.zetkin.lyra.backend.env
import org.zetkin.lyra.backend.logger
import org.zetkin.lyra.backend.services.GitSyncService

private const val DEFAULT_SYNC_INTERVAL_SECONDS = 300L

fun Application.startSyncScheduler() {
    val gitSyncService by inject<GitSyncService>()
    val intervalSeconds = env("SYNC_INTERVAL_SECONDS")?.toLongOrNull() ?: DEFAULT_SYNC_INTERVAL_SECONDS
    val log = logger()

    launch {
        log.info("Running initial sync")
        gitSyncService.syncAll()
        log.info("Sync scheduler started (interval: ${intervalSeconds}s)")
        while (true) {
            delay(intervalSeconds * 1_000L)
            log.info("Running scheduled sync")
            gitSyncService.syncAll()
        }
    }
}
