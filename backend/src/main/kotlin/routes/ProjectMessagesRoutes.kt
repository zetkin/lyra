package org.zetkin.lyra.backend.routes

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.koin.ktor.ext.inject
import org.zetkin.lyra.backend.plugins.db.models.Message
import org.zetkin.lyra.backend.plugins.db.models.TranslationState
import org.zetkin.lyra.backend.repositories.LanguageRepository
import org.zetkin.lyra.backend.repositories.ProjectRepository
import org.zetkin.lyra.backend.services.MessageService

@Serializable
data class TranslationRequest(val text: String)

@Serializable
data class PagedMessages(
    val items: List<Message>,
    val total: Int,
    val offset: Long,
    val limit: Int,
)

private fun parseStateFilter(param: String?): TranslationState? {
    if (param == null) return null
    return TranslationState.entries.find { it.name.equals(param, ignoreCase = true) }
        ?: throw IllegalArgumentException("Unknown state '$param'")
}

fun Application.projectMessagesRoutes() {
    val messageService by inject<MessageService>()
    val projectRepo by inject<ProjectRepository>()
    val languageRepo by inject<LanguageRepository>()
    routing {
        route("/api/repository/{repositoryName}/projects/{projectId}") {

            get {
                val projectId = call.parameters["projectId"]!!.toInt()
                try {
                    val project = projectRepo.findById(projectId)
                    project.supportedLanguages = languageRepo.findByProjectId(projectId)
                    call.respond(project)
                } catch (e: NoSuchElementException) {
                    call.respondText(e.message ?: "Not found", status = HttpStatusCode.NotFound)
                }
            }

            get("/messages/{messageId?}") {
                val projectId = call.parameters["projectId"]!!.toInt()
                val offset = call.queryParameters["offset"]!!.toLong()
                val limit = call.queryParameters["limit"]!!.toInt()
                val lang = call.queryParameters["lang"]!!
                val messageId = call.parameters["messageId"]
                val search = call.queryParameters["search"]
                try {
                    val stateFilter = parseStateFilter(call.queryParameters["state"])
                    val (items, total) = if (search != null) {
                        messageService.searchMessages(
                            projectId = projectId,
                            query = search,
                            messageId = messageId,
                            stateFilter = stateFilter,
                            offset = offset,
                            limit = limit,
                            lang = lang,
                        )
                    } else {
                        messageService.getMessages(
                            projectId = projectId,
                            messageId = messageId,
                            stateFilter = stateFilter,
                            offset = offset,
                            limit = limit,
                            lang = lang,
                        )
                    }
                    call.respond(PagedMessages(items, total, offset, limit))
                } catch (e: NoSuchElementException) {
                    call.respondText(e.message ?: "Not found", status = HttpStatusCode.NotFound)
                } catch (e: IllegalArgumentException) {
                    call.respondText(e.message ?: "Bad request", status = HttpStatusCode.BadRequest)
                }
            }

            post("/messages/{i18nKey}") {
                val projectId = call.parameters["projectId"]!!.toInt()
                val i18nKey = call.parameters["i18nKey"]!!
                val lang = call.queryParameters["lang"]
                    ?: return@post call.respondText(
                        "Query parameter 'lang' is required",
                        status = HttpStatusCode.BadRequest
                    )
                val body = call.receive<TranslationRequest>()
                try {
                    call.respond(messageService.submitTranslation(projectId, i18nKey, lang, body.text))
                } catch (e: NoSuchElementException) {
                    call.respondText(e.message ?: "Not found", status = HttpStatusCode.NotFound)
                } catch (e: IllegalArgumentException) {
                    call.respondText(e.message ?: "Bad request", status = HttpStatusCode.BadRequest)
                }
            }
        }
    }
}
