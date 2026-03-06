package org.zetkin.lyra.backend.plugins

import io.ktor.server.application.*
import io.ktor.server.plugins.swagger.*
import io.ktor.server.routing.*
import org.zetkin.lyra.backend.routes.projectMessagesRoutes
import org.zetkin.lyra.backend.routes.pullRequestRoutes
import org.zetkin.lyra.backend.routes.repositoryRoutes

fun Application.configureRouting() {
    routing {
        swaggerUI(path = "swagger", swaggerFile = "openapi.yaml")
    }
    repositoryRoutes()
    projectMessagesRoutes()
    pullRequestRoutes()
}
