package org.zetkin.lyra.backend.repositories

import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.upsert
import org.zetkin.lyra.backend.plugins.db.models.Paths
import org.zetkin.lyra.backend.plugins.db.models.Project
import org.zetkin.lyra.backend.plugins.db.models.Projects
import org.zetkin.lyra.backend.plugins.db.models.Repos
import org.zetkin.lyra.backend.plugins.db.models.toProject

/** Manages persistence for projects within a repository. */
class ProjectRepository {

    /**
     * Creates or updates a project record for [repoId] and [projectPath], returning its ID.
     *
     * The ID is always read back via a follow-up SELECT because SQLite does not update
     * `last_insert_rowid()` when the upsert resolves as an UPDATE.
     */
    fun upsert(repoId: Int, projectPath: String): Int = transaction {
        Projects.upsert(Projects.repoId, Projects.projectPath) {
            it[Projects.repoId] = repoId
            it[Projects.projectPath] = projectPath
        }
        // SQLite does not update last_insert_rowid() when the upsert resolves as UPDATE,
        // so reading the generated ID from the statement result would return 0. We always
        // read back the real ID via a follow-up SELECT.
        Projects.selectAll()
            .where { (Projects.repoId eq repoId) and (Projects.projectPath eq projectPath) }
            .single()[Projects.id]
    }

    /** Deletes projects in [repoId] whose paths are not listed in [activePaths]. */
    fun deleteStale(repoId: Int, activePaths: List<String>) = transaction {
        Projects.deleteWhere {
            (Projects.repoId eq repoId) and (Projects.projectPath notInList activePaths)
        }
    }

    /** Returns all projects belonging to the given repository. */
    fun findByRepo(repoId: Int): List<Project> = transaction {
        Projects
            .join(Repos, JoinType.INNER, Projects.repoId, Repos.id)
            .selectAll().where { Projects.repoId eq repoId }.map { it.toProject() }
    }

    /** Returns the project with [projectId], or throws [NoSuchElementException] if not found. */
    fun findById(projectId: Int): Project = transaction {
        Projects
            .join(Repos, JoinType.INNER, Projects.repoId, Repos.id)
            .selectAll()
            .where { Projects.id eq projectId }
            .singleOrNull()
            ?.toProject()
            ?: throw NoSuchElementException("Project '$projectId' not found")
    }

    /** Returns all projects across all repositories. */
    fun findAll(): List<Project> = transaction {
        Projects
            .join(Repos, JoinType.INNER, Projects.repoId, Repos.id)
            .selectAll().map { it.toProject() }
    }

}
