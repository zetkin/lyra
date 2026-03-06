package org.zetkin.lyra.backend.routes

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.koin.ktor.ext.inject
import org.zetkin.lyra.backend.plugins.git.RepositoriesConfig
import org.zetkin.lyra.backend.repositories.RepoRepository
import org.zetkin.lyra.backend.services.PullRequestService

@Serializable
data class CreatePrResponse(val url: String, val prNumber: Int)

fun Application.pullRequestRoutes() {
    val repoRepo by inject<RepoRepository>()
    val reposConfig by inject<RepositoriesConfig>()
    val pullRequestService by inject<PullRequestService>()

    routing {
        post("/api/repository/{repositoryName}/pull-request") {
            val repositoryName = call.parameters["repositoryName"]!!
            val repo = repoRepo.findByName(repositoryName)
                ?: return@post call.respond(HttpStatusCode.NotFound)
            val repoConfig = reposConfig.repositories.find { it.name == repositoryName }
                ?: return@post call.respondText("No config for '$repositoryName'", status = HttpStatusCode.InternalServerError)

            try {
                call.respond(HttpStatusCode.Created, pullRequestService.createPullRequest(repo, repoConfig))
            } catch (e: IllegalStateException) {
                call.respondText(e.message ?: "Cannot create pull request", status = HttpStatusCode.BadRequest)
            }
        }
    }
}
