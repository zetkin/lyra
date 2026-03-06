package org.zetkin.lyra.backend.services

import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import org.zetkin.lyra.backend.plugins.git.GitClient.PullRequestData
import org.zetkin.lyra.backend.plugins.git.GitHubClient
import org.zetkin.lyra.backend.plugins.git.RepositoryConfig
import org.zetkin.lyra.backend.plugins.db.models.Repo
import org.zetkin.lyra.backend.repositories.PullRequestRepository
import org.zetkin.lyra.backend.routes.CreatePrResponse
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

class PullRequestService : KoinComponent {
    private val gitHubClient: GitHubClient by inject()
    private val pullRequestRepo: PullRequestRepository by inject()
    private val translationBranchService: TranslationBranchService by inject()

    suspend fun createPullRequest(repo: Repo, repoConfig: RepositoryConfig): CreatePrResponse {
        val branchResult = translationBranchService.createBranchWithTranslations(repo.name, repo.id)

        val timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
        val languages = branchResult.submissions.map { it.lang }.distinct().sorted().joinToString(", ")
        val prTitle = "Lyra translations $timestamp ($languages)"
        val prBody = buildString {
            branchResult.submissions
                .groupBy { it.lang }
                .toSortedMap()
                .forEach { (lang, items) ->
                    appendLine("## Language '$lang'")
                    items.forEach { appendLine("- `${it.key}`:\n\t${it.text}") }
                    appendLine()
                }
        }.trimEnd()

        val result = gitHubClient.createPullRequest(
            repoOwner = repo.owner,
            repositoryName = repo.name,
            pr = PullRequestData(title = prTitle, body = prBody, head = branchResult.branchName, base = repo.baseBranch),
            token = repoConfig.githubToken,
        )
        val pullRequestId = pullRequestRepo.create(repo.id, result.id, result.url, branchResult.branchName)
        pullRequestRepo.linkSubmittedTranslations(repo.id, pullRequestId)

        return CreatePrResponse(result.url, result.id)
    }
}
