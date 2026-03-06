package org.zetkin.lyra.backend.repositories

import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.update
import org.zetkin.lyra.backend.plugins.db.models.I18nKeys
import org.zetkin.lyra.backend.plugins.db.models.Paths
import org.zetkin.lyra.backend.plugins.db.models.Projects
import org.zetkin.lyra.backend.plugins.db.models.PullRequestStatus
import org.zetkin.lyra.backend.plugins.db.models.PullRequests
import org.zetkin.lyra.backend.plugins.db.models.TranslationState
import org.zetkin.lyra.backend.plugins.db.models.Translations
import org.zetkin.lyra.backend.plugins.db.models.toPullRequest

/** Manages persistence for pull requests. */
class PullRequestRepository {

    /** Creates a new pull request record with status [PullRequestStatus.OPEN] and returns its ID. */
    fun create(repoId: Int, prNumber: Int, url: String, branch: String): Int = transaction {
        PullRequests.insert {
            it[PullRequests.repoId] = repoId
            it[PullRequests.status] = PullRequestStatus.OPEN.name
            it[PullRequests.prNumber] = prNumber
            it[PullRequests.url] = url
            it[PullRequests.branch] = branch
        }[PullRequests.id]
    }

    /** Returns all open pull requests for the given repository. */
    fun findOpenByRepo(repoId: Int) = transaction {
        PullRequests.selectAll()
            .where { (PullRequests.repoId eq repoId) and (PullRequests.status eq PullRequestStatus.OPEN.name) }
            .map { it.toPullRequest() }
    }

    /** Marks the pull request with [prId] as [PullRequestStatus.MERGED]. */
    fun markMerged(prId: Int): Unit = transaction {
        PullRequests.update({ PullRequests.id eq prId }) {
            it[PullRequests.status] = PullRequestStatus.MERGED.name
        }
    }

    /** Marks the pull request with [prId] as [PullRequestStatus.CLOSED]. */
    fun markClosed(prId: Int): Unit = transaction {
        PullRequests.update({ PullRequests.id eq prId }) {
            it[PullRequests.status] = PullRequestStatus.CLOSED.name
        }
    }

    /**
     * Marks all PART_OF_PULL_REQUEST translations linked to [prId] as PUBLISHED
     * and clears the pull_request FK. Called when a PR is merged.
     */
    fun markTranslationsPublished(prId: Int): Int = transaction {
        Translations.update({ Translations.pullRequest eq prId }) {
            it[Translations.state] = TranslationState.PUBLISHED.name
            it[Translations.pullRequest] = null
        }
    }

    /**
     * Marks all SUBMITTED translations for the given repo as PART_OF_PULL_REQUEST
     * and links them to the given pull request.
     */
    fun linkSubmittedTranslations(repoId: Int, pullRequestId: Int): Int = transaction {
        val pathIds = Paths
            .join(Projects, JoinType.INNER, Paths.project, Projects.id)
            .selectAll()
            .where { Projects.repoId eq repoId }
            .map { it[Paths.id] }

        if (pathIds.isEmpty()) return@transaction 0

        val keyIds = I18nKeys.selectAll()
            .where { I18nKeys.path inList pathIds }
            .map { it[I18nKeys.id] }

        if (keyIds.isEmpty()) return@transaction 0

        Translations.update({
            (Translations.key inList keyIds) and (Translations.state eq TranslationState.SUBMITTED.name)
        }) {
            it[Translations.state] = TranslationState.PART_OF_PULL_REQUEST.name
            it[Translations.pullRequest] = pullRequestId
        }
    }

}
