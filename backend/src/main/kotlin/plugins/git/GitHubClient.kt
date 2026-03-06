package org.zetkin.lyra.backend.plugins.git

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.zetkin.lyra.backend.plugins.db.models.PullRequestStatus
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

private val json = Json { ignoreUnknownKeys = true }

class GitHubClient : GitClient() {

    @Serializable
    private data class CreatePrBody(
        val title: String,
        val body: String?,
        val head: String,
        val base: String,
    )

    override suspend fun createPullRequest(
        repoOwner: String,
        repositoryName: String,
        pr: PullRequestData,
        token: String,
    ): PullRequestResult {
        val requestBody = json.encodeToString(CreatePrBody(pr.title, pr.body, pr.head, pr.base))
        val request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.github.com/repos/$repoOwner/$repositoryName/pulls"))
            .header("Authorization", "Bearer $token")
            .header("Accept", "application/vnd.github+json")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .build()

        val response = HttpClient.newHttpClient()
            .send(request, HttpResponse.BodyHandlers.ofString())

        check(response.statusCode() == 201) {
            "GitHub API returned ${response.statusCode()}: ${response.body()}"
        }

        val responseJson = json.parseToJsonElement(response.body()).jsonObject
        val id = responseJson["number"]!!.jsonPrimitive.content.toInt()
        val url = responseJson["html_url"]!!.jsonPrimitive.content
        return PullRequestResult(id, url)
    }

    /**
     * Queries the GitHub API for the current status of a pull request.
     */
    suspend fun getPullRequestStatus(
        repoOwner: String,
        repositoryName: String,
        prNumber: Int,
        token: String,
    ): PullRequestStatus = withContext(Dispatchers.IO) {
        val request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.github.com/repos/$repoOwner/$repositoryName/pulls/$prNumber"))
            .header("Authorization", "Bearer $token")
            .header("Accept", "application/vnd.github+json")
            .GET()
            .build()

        val response = HttpClient.newHttpClient()
            .send(request, HttpResponse.BodyHandlers.ofString())

        check(response.statusCode() == 200) {
            "GitHub API returned ${response.statusCode()}: ${response.body()}"
        }

        val responseJson = json.parseToJsonElement(response.body()).jsonObject
        val state = responseJson["state"]!!.jsonPrimitive.content
        val mergedAtElement = responseJson["merged_at"]
        val mergedAt = if (mergedAtElement == null || mergedAtElement is JsonNull) null
                       else mergedAtElement.jsonPrimitive.content

        when {
            mergedAt != null -> PullRequestStatus.MERGED
            state == "closed" -> PullRequestStatus.CLOSED
            else -> PullRequestStatus.OPEN
        }
    }
}
