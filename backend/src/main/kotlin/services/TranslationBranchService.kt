package org.zetkin.lyra.backend.services

import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import org.zetkin.lyra.backend.logger
import org.zetkin.lyra.backend.plugins.git.GitHubClient
import org.zetkin.lyra.backend.plugins.git.parseLyraConfig
import org.zetkin.lyra.backend.repositories.TranslationRepository
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

data class BranchCreationResult(
    val branchName: String,
    val submissions: List<org.zetkin.lyra.backend.repositories.SubmittedTranslation>,
)

class TranslationBranchService : KoinComponent {
    private val gitClient: GitHubClient by inject()
    private val translationRepo: TranslationRepository by inject()
    private val log = logger()

    suspend fun createBranchWithTranslations(repositoryName: String, repoId: Int): BranchCreationResult {
        val now = LocalDateTime.now()
        val timestamp = now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd-HH-mm"))
        val branchName = "lyra-translations/$timestamp"

        val repoDir = reposDir().resolve(repositoryName)

        val submissions = translationRepo.findSubmittedByRepo(repoId)
        val submissionLangs = submissions.map { it.lang }.distinct().joinToString(", ")
        val commitMessage = "Add lyra translations for languages $submissionLangs"
        check(submissions.isNotEmpty()) { "No submitted translations found for repo '$repositoryName'" }

        val lyraConfig = parseLyraConfig(repoDir.resolve(".lyra.yaml").toFile())
        val projectConfigByPath = lyraConfig.projects.associateBy { it.path }

        gitClient.createBranch(repoDir, branchName, checkout = true, push = false)
        log.info("Created branch '$branchName' in '$repositoryName'")

        submissions
            .groupBy { it.projectPath }
            .forEach { (projectPath, projectSubmissions) ->
                val lyraProject = requireNotNull(projectConfigByPath[projectPath]) {
                    "Project '$projectPath' not found in .lyra.yaml for repo '$repositoryName'"
                }
                val translationsDir = repoDir.resolve(projectPath).resolve(lyraProject.translations.path)

                projectSubmissions
                    .groupBy { it.lang }
                    .forEach { (lang, langSubmissions) ->
                        val ymlFile = translationsDir.resolve("$lang.yml")
                        val updates = langSubmissions.associate { it.key to it.text }
                        val existing = if (ymlFile.toFile().exists()) ymlFile.toFile().readText() else ""
                        ymlFile.toFile().writeText(patchYamlTranslations(existing, updates))
                        log.info("Wrote ${updates.size} translations for '$lang' to $ymlFile")
                    }
            }

        val sha = gitClient.commit(repoDir, commitMessage)
        log.info("Committed translations (SHA: $sha)")
        gitClient.push(repoDir, branch = branchName)
        log.info("Pushed branch '$branchName'")

        return BranchCreationResult(branchName, submissions)
    }
}
