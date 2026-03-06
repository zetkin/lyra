package org.zetkin.lyra.backend.plugins.db.models

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.Table

enum class PullRequestStatus { OPEN, CLOSED, MERGED }

@Serializable
data class PullRequest(
    val id: Int,
    val repoId: Int,
    val status: PullRequestStatus,
    val prNumber: Int,
    val url: String,
    val branch: String,
)

fun ResultRow.toPullRequest() = PullRequest(
    id = this[PullRequests.id],
    repoId = this[PullRequests.repoId],
    status = PullRequestStatus.valueOf(this[PullRequests.status]),
    prNumber = this[PullRequests.prNumber],
    url = this[PullRequests.url],
    branch = this[PullRequests.branch],
)

object PullRequests : Table("pull_request") {
    val id = integer("id").autoIncrement()
    val repoId = reference("repo", Repos.id)
    val status = text("status")
    val prNumber = integer("pr_number")
    val url = text("url")
    val branch = text("branch")

    override val primaryKey = PrimaryKey(id)
}
