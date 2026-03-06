package org.zetkin.lyra.backend.repositories

import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.upsert
import org.zetkin.lyra.backend.plugins.db.models.Repo
import org.zetkin.lyra.backend.plugins.db.models.Repos
import org.zetkin.lyra.backend.plugins.db.models.toRepo
import org.zetkin.lyra.backend.plugins.git.RepositoryConfig

/** Manages persistence for Git repository records. */
class RepoRepository {

    /**
     * Creates or updates a repository record from [config], returning its ID.
     *
     * Uses upsert on [Repos.name] as the conflict key. Because SQLite does not update
     * `last_insert_rowid()` on the UPDATE path of an upsert, the ID is always read back
     * via a follow-up SELECT.
     */
    fun upsert(config: RepositoryConfig): Int = transaction {
        Repos.upsert(Repos.name) {
            it[Repos.name] = config.name
            it[Repos.baseBranch] = config.baseBranch
            it[Repos.host] = config.host
            it[Repos.owner] = config.owner
        }
        // SQLite does not update last_insert_rowid() on UPDATE path of upsert — read back via SELECT.
        Repos.selectAll().where { Repos.name eq config.name }.single()[Repos.id]
    }

    /** Returns all repositories. */
    fun findAll(): List<Repo> = transaction {
        Repos.selectAll().map { it.toRepo() }
    }

    /** Returns the repository with the given [name], or `null` if not found. */
    fun findByName(name: String): Repo? = transaction {
        Repos.selectAll().where { Repos.name eq name }.singleOrNull()?.toRepo()
    }

}
