package org.zetkin.lyra.backend.services

import org.eclipse.jgit.api.errors.TransportException
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import org.zetkin.lyra.backend.env
import org.zetkin.lyra.backend.logger
import org.zetkin.lyra.backend.plugins.db.models.PullRequestStatus
import org.zetkin.lyra.backend.plugins.git.GitHubClient
import org.zetkin.lyra.backend.plugins.git.LyraProjectConfig
import org.zetkin.lyra.backend.plugins.git.RepositoriesConfig
import org.zetkin.lyra.backend.plugins.git.RepositoryConfig
import org.zetkin.lyra.backend.plugins.git.parseLyraConfig
import org.zetkin.lyra.backend.repositories.ProjectRepository
import org.zetkin.lyra.backend.repositories.PullRequestRepository
import org.zetkin.lyra.backend.repositories.RepoRepository
import java.nio.file.Path
import kotlin.io.path.exists

private const val LYRA_YAML_FILE = ".lyra.yaml"

internal fun reposDir(): Path = Path.of(env("REPOS_DIR") ?: "/opt/lyra-repos")

class GitSyncService : KoinComponent {
    private val gitClient: GitHubClient by inject()
    private val config: RepositoriesConfig by inject()
    private val repoRepo: RepoRepository by inject()
    private val projectRepo: ProjectRepository by inject()
    private val pullRequestRepo: PullRequestRepository by inject()
    private val languageService: LanguageService by inject()
    private val typeScriptMessageSyncService: TypeScriptMessageSyncService by inject()
    private val translationSyncService: TranslationSyncService by inject()
    private val log = logger()

    suspend fun syncAll() {
        val reposDir = reposDir()
        config.repositories.forEach { repo ->
            val repoDir = reposDir.resolve(repo.name)
            if (!repoDir.exists()) {
                log.info("Repo at $repoDir does not exist. Cloning it...")
                gitClient.clone(repo.sshUrl, repoDir)
            }
            gitClient.checkout(repoDir, repo.baseBranch)
            try {
                syncRepoIfNewCommits(repo, repoDir)

            } catch (e: TransportException) {
                log.error(
                    "Cannot sync repo because of network connection issues. Check your internet connection and try again.",
                    e
                )
            }
            checkMergedPullRequests(repo)
        }
    }

    private suspend fun syncRepoIfNewCommits(repo: RepositoryConfig, repoDir: Path) {
        if (!repoDir.exists()) {
            log.info("Cloning '${repo.name}' from ${repo.sshUrl} into $repoDir")
            val sha = gitClient.clone(repo.sshUrl, repoDir, repo.baseBranch)
            log.info("Cloned ${repo.name} (HEAD: $sha)")
            syncProjectsFromRepo(repo, repoDir)
            return
        }

        val repoInDb = repoRepo.findByName(repo.name) != null
        val headBefore = gitClient.getHead(repoDir)
        val headAfter = gitClient.pull(repoDir, repo.baseBranch)

        if (repoInDb && headBefore == headAfter) {
            log.info("No new commits in '${repo.name}', skipping sync")
            return
        }

        log.info("Syncing '${repo.name}' ($headBefore → $headAfter)")
        syncProjectsFromRepo(repo, repoDir)
    }

    private suspend fun checkMergedPullRequests(repo: RepositoryConfig) {
        val repoId = repoRepo.findByName(repo.name)?.id ?: return
        val openPrs = pullRequestRepo.findOpenByRepo(repoId)
        if (openPrs.isEmpty()) return

        openPrs.forEach { pr ->
            try {
                val status = gitClient.getPullRequestStatus(repo.owner, repo.name, pr.prNumber, repo.githubToken)
                when (status) {
                    PullRequestStatus.MERGED -> {
                        pullRequestRepo.markMerged(pr.id)
                        pullRequestRepo.markTranslationsPublished(pr.id)
                        log.info("PR #${pr.prNumber} (${repo.name}) merged — translations published")
                    }

                    PullRequestStatus.CLOSED -> {
                        pullRequestRepo.markClosed(pr.id)
                        log.info("PR #${pr.prNumber} (${repo.name}) closed without merge")
                    }

                    PullRequestStatus.OPEN -> {}
                }
            } catch (e: Exception) {
                log.warn("Failed to check status of PR #${pr.prNumber} (${repo.name}): ${e.message}")
            }
        }
    }

    private fun syncProjectsFromRepo(repo: RepositoryConfig, repoDir: Path) {
        val lyraConfigFile = repoDir.resolve(LYRA_YAML_FILE).toFile()
        check(lyraConfigFile.exists()) { "$LYRA_YAML_FILE not found in $repoDir" }

        val lyraConfig = parseLyraConfig(lyraConfigFile)
        val activePaths = lyraConfig.projects.map { it.path }

        val projectIds: Map<String, Int> = transaction {
            val repoId = repoRepo.upsert(repo)
            projectRepo.deleteStale(repoId, activePaths)
            lyraConfig.projects.associate { lyraProject ->
                val projectId = projectRepo.upsert(repoId, lyraProject.path)
                languageService.syncLanguages(projectId, lyraProject.languages)
                lyraProject.path to projectId
            }
        }

        lyraConfig.projects.forEach { lyraProject ->
            val projectId = projectIds.getValue(lyraProject.path)
            val projectDir = repoDir.resolve(lyraProject.path)
            typeScriptMessageSyncService.sync(projectId, projectDir, lyraProject.messages)
            translationSyncService.sync(projectId, projectDir, lyraProject)
        }

        log.info("Synced ${lyraConfig.projects.size} project(s) from '${repo.name}'")
    }
}
