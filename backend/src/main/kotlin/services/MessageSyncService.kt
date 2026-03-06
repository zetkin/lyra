package org.zetkin.lyra.backend.services

import org.zetkin.lyra.backend.plugins.git.LyraMessagesConfig
import java.nio.file.Path

interface MessageSyncService {
    fun sync(projectId: Int, projectDir: Path, messagesConfig: LyraMessagesConfig)
}
