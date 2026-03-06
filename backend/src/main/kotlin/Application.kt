package org.zetkin.lyra.backend

import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.koin.core.logger.Level
import org.koin.dsl.module
import org.koin.ktor.plugin.Koin
import org.koin.logger.slf4jLogger
import org.zetkin.lyra.backend.plugins.configureRouting
import org.zetkin.lyra.backend.plugins.db.DatabaseFactory
import org.zetkin.lyra.backend.plugins.git.GitHubClient
import org.zetkin.lyra.backend.plugins.git.loadRepositoriesConfig
import org.zetkin.lyra.backend.plugins.git.startSyncScheduler
import org.zetkin.lyra.backend.repositories.*
import org.zetkin.lyra.backend.services.*
import java.security.Security

private const val DEFAULT_LYRA_PORT = 8080

val appModule = module {
    single { GitHubClient() }
    single { loadRepositoriesConfig() }
    single { RepoRepository() }
    single { PullRequestRepository() }
    single { ProjectRepository() }
    single { LanguageRepository() }
    single { PathRepository() }
    single { I18nKeyRepository() }
    single { TranslationRepository() }
    single { LanguageService() }
    single { MessageService() }
    single { TypeScriptMessageSyncService() }
    single { TranslationSyncService() }
    single { TranslationBranchService() }
    single { PullRequestService() }
    single { GitSyncService() }
}

fun main() {
    configureLogging()
    Security.addProvider(BouncyCastleProvider())
    val port = env("LYRA_BACKEND_PORT")?.toIntOrNull() ?: DEFAULT_LYRA_PORT
    embeddedServer(Netty, port = port, host = "0.0.0.0") {
        module()
    }.start(wait = true)
}

fun Application.module() {
    DatabaseFactory.init()

    val debug = env("DEBUG")?.toBoolean() ?: false
    install(Koin) {
        slf4jLogger(level = if (debug) Level.DEBUG else Level.INFO)
        modules(appModule)
    }

    install(CORS) {
        allowHost("localhost:3000")
        allowHeader(HttpHeaders.ContentType)
    }
    install(ContentNegotiation) {
        json()
    }

    configureRouting()
    startSyncScheduler()
}
