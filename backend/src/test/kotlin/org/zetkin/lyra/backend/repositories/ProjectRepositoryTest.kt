package org.zetkin.lyra.backend.repositories

import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.AfterAll
import org.zetkin.lyra.backend.TestDatabase
import org.zetkin.lyra.backend.plugins.db.models.Projects
import org.zetkin.lyra.backend.plugins.git.LyraMessagesConfig
import org.zetkin.lyra.backend.plugins.git.LyraProjectConfig
import org.zetkin.lyra.backend.plugins.git.LyraTranslationsConfig
import org.zetkin.lyra.backend.plugins.git.RepositoryConfig
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ProjectRepositoryTest {

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

    private val repoConfig = RepositoryConfig(
        name = "test-repo",
        owner = "test-owner",
        githubToken = "token",
    )

    private val projectPath = "app"
    private val otherProjectPath = "packages/other"

    @BeforeTest
    fun setup() {
        TestDatabase.clearAll()
    }

    @Test
    fun `upsert returns correct ID on INSERT`() {
        val repoId = repoRepo.upsert(repoConfig)
        val id = projectRepo.upsert(repoId, projectPath)
        assertTrue(id > 0, "Expected a positive project ID, got $id")
    }

    @Test
    fun `upsert returns the same ID on repeated call`() {
        val repoId = repoRepo.upsert(repoConfig)
        val id1 = projectRepo.upsert(repoId, projectPath)
        val id2 = projectRepo.upsert(repoId, projectPath)
        assertEquals(id1, id2, "Expected same ID on re-upsert, got $id1 vs $id2")
    }

    @Test
    fun `upsert does not create duplicate rows`() {
        val repoId = repoRepo.upsert(repoConfig)
        projectRepo.upsert(repoId, projectPath)
        projectRepo.upsert(repoId, projectPath)

        val rowCount = transaction {
            Projects.selectAll()
                .where { (Projects.repoId eq repoId) and (Projects.projectPath eq projectPath) }
                .count()
        }
        assertEquals(1L, rowCount, "Expected exactly one project row after two upserts")
    }

    @Test
    fun `upsert creates separate row for different project path`() {
        val repoId = repoRepo.upsert(repoConfig)
        val id1 = projectRepo.upsert(repoId, projectPath)
        val id2 = projectRepo.upsert(repoId, otherProjectPath)

        assertTrue(id1 != id2, "Expected different IDs for different project paths")
        val rowCount = transaction { Projects.selectAll().count() }
        assertEquals(2L, rowCount)
    }
}
