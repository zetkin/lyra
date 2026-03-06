package org.zetkin.lyra.backend.repositories

import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.AfterAll
import org.zetkin.lyra.backend.TestDatabase
import org.zetkin.lyra.backend.plugins.db.models.Paths
import org.zetkin.lyra.backend.plugins.git.RepositoryConfig
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class PathRepositoryTest {

    companion object {
        init {
            TestDatabase.init()
        }

        @JvmStatic
        @AfterAll
        fun teardown() {
            TestDatabase.clearAll()
        }
    }

    private val repoRepo = RepoRepository()
    private val projectRepo = ProjectRepository()
    private val pathRepo = PathRepository()

    private val repoConfig = RepositoryConfig(
        name = "test-repo",
        owner = "test-owner",
        githubToken = "token",
    )

    @BeforeTest
    fun setup() {
        TestDatabase.clearAll()
    }

    @Test
    fun `findOrCreate inserts a new path and returns a positive ID`() {
        val repoId = repoRepo.upsert(repoConfig)
        val projectId = projectRepo.upsert(repoId, "app")
        val pathId = pathRepo.findOrCreate(projectId, "src/app/l10n/messageIds.ts")
        assertTrue(pathId > 0)
    }

    @Test
    fun `findOrCreate is idempotent`() {
        val repoId = repoRepo.upsert(repoConfig)
        val projectId = projectRepo.upsert(repoId, "app")
        val pathValue = "src/app/l10n/messageIds.ts"

        val id1 = pathRepo.findOrCreate(projectId, pathValue)
        val id2 = pathRepo.findOrCreate(projectId, pathValue)

        assertEquals(id1, id2, "Expected same path ID on second call")

        val rowCount = transaction {
            Paths.selectAll()
                .where { Paths.value eq pathValue }
                .count()
        }
        assertEquals(1L, rowCount, "Expected exactly one path row")
    }

    @Test
    fun `findOrCreate scopes paths by project`() {
        val repoId = repoRepo.upsert(repoConfig)
        val projectId1 = projectRepo.upsert(repoId, "app")
        val projectId2 = projectRepo.upsert(repoId, "packages/other")
        val pathValue = "src/l10n/messageIds.ts"

        val id1 = pathRepo.findOrCreate(projectId1, pathValue)
        val id2 = pathRepo.findOrCreate(projectId2, pathValue)

        assertTrue(id1 != id2, "Expected different path IDs for different projects")
    }
}
