package org.zetkin.lyra.backend.repositories

import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertIgnore
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.zetkin.lyra.backend.logger
import org.zetkin.lyra.backend.plugins.db.models.Paths
import org.zetkin.lyra.backend.plugins.db.models.SourcePath
import org.zetkin.lyra.backend.plugins.db.models.toSourcePath

/** Manages persistence for source file paths within a project. */
class PathRepository {

    private val log = logger()

    /** Returns the [SourcePath] matching [projectId] and [path]. */
    fun find(projectId: Int, path: String): SourcePath = transaction {
        Paths.selectAll()
            .where { (Paths.project eq projectId) and (Paths.value eq path) }
            .map { it.toSourcePath() }
            .single()
    }

    /**
     * Returns the ID of the path record for [projectId] and [value], creating it if it doesn't exist.
     *
     * Uses `INSERT OR IGNORE` followed by a SELECT to handle the conflict case idempotently.
     */
    fun findOrCreate(projectId: Int, value: String): Int = transaction {
        Paths.insertIgnore {
            it[Paths.project] = projectId
            it[Paths.value] = value
        }
        // Read back to handle both insert and conflict-ignore cases.
        Paths.selectAll()
            .where { (Paths.project eq projectId) and (Paths.value eq value) }
            .single()[Paths.id]
    }

    /** Returns the IDs of paths in [projectId] that are not listed in [activePaths]. */
    fun findStaleIds(projectId: Int, activePaths: List<String>): List<Int> = transaction {
        Paths.selectAll()
            .where { (Paths.project eq projectId) and (Paths.value notInList activePaths) }
            .map { it[Paths.id] }
    }

    /** Deletes paths with the given [ids]. Returns 0 and logs a warning if [ids] is empty. */
    fun deleteByIds(ids: List<Int>): Int = transaction {
        if (ids.isEmpty()) {
            log.warn("Cannot delete any id's when given list is empty.")
            return@transaction 0
        }
        Paths.deleteWhere { Paths.id inList ids }
    }
}
