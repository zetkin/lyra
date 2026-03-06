package org.zetkin.lyra.backend.routes

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.koin.ktor.ext.inject
import org.zetkin.lyra.backend.repositories.LanguageRepository
import org.zetkin.lyra.backend.repositories.ProjectRepository
import org.zetkin.lyra.backend.repositories.RepoRepository
import org.zetkin.lyra.backend.repositories.I18nKeyRepository

fun Application.repositoryRoutes() {
    val repoRepo by inject<RepoRepository>()
    val projectRepo by inject<ProjectRepository>()
    val languageRepo by inject<LanguageRepository>()
    val i18nKeyRepo by inject<I18nKeyRepository>()
    routing {
        route("/api") {
            get("/repositories") {
                call.respond(repoRepo.findAll())
            }
            get("/repository/{repositoryName}/projects") {
                val repositoryName = call.parameters["repositoryName"]!!
                val repo = repoRepo.findByName(repositoryName)
                    ?: return@get call.respond(HttpStatusCode.NotFound)
                val projects = projectRepo.findByRepo(repo.id)
                projects.forEach {
                    it.supportedLanguages = languageRepo.findByProjectId(it.id)
                    it.messageCount = i18nKeyRepo.count(it.id)
                }
                call.respond(projects)
            }
        }
    }
}
