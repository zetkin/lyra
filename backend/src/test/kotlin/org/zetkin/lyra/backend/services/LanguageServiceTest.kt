package org.zetkin.lyra.backend.services

import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.AfterAll
import org.zetkin.lyra.backend.TestDatabase
import org.zetkin.lyra.backend.plugins.db.models.ProjectLangs
import org.zetkin.lyra.backend.plugins.git.RepositoryConfig
import org.zetkin.lyra.backend.repositories.ProjectRepository
import org.zetkin.lyra.backend.repositories.RepoRepository
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class LanguageServiceTest {

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
    private val languageService = LanguageService()

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
    fun `syncLanguages creates project_lang rows for the given project`() {
        val repoId = repoRepo.upsert(repoConfig)
        val projectId = projectRepo.upsert(repoId, "app")

        languageService.syncLanguages(projectId, listOf("en", "da"))

        val langs = transaction {
            ProjectLangs.selectAll()
                .where { ProjectLangs.project eq projectId }
                .map { it[ProjectLangs.lang] }
        }
        assertEquals(setOf("en", "da"), langs.toSet())
    }

    @Test
    fun `syncLanguages is idempotent`() {
        val repoId = repoRepo.upsert(repoConfig)
        val projectId = projectRepo.upsert(repoId, "app")

        languageService.syncLanguages(projectId, listOf("en", "da"))
        languageService.syncLanguages(projectId, listOf("en", "da"))

        val rowCount = transaction {
            ProjectLangs.selectAll()
                .where { ProjectLangs.project eq projectId }
                .count()
        }
        assertEquals(2L, rowCount, "Expected exactly 2 project_lang rows after two identical sync calls")
    }

    @Test
    fun `syncLanguages removes stale languages`() {
        val repoId = repoRepo.upsert(repoConfig)
        val projectId = projectRepo.upsert(repoId, "app")

        languageService.syncLanguages(projectId, listOf("en", "da", "de"))
        languageService.syncLanguages(projectId, listOf("en", "da"))

        val langs = transaction {
            ProjectLangs.selectAll()
                .where { ProjectLangs.project eq projectId }
                .map { it[ProjectLangs.lang] }
        }
        assertEquals(setOf("en", "da"), langs.toSet())
        assertTrue("de" !in langs, "Stale language 'de' should have been removed")
    }

    @Test
    fun `syncLanguages is scoped to the given project`() {
        val repoId = repoRepo.upsert(repoConfig)
        val projectId1 = projectRepo.upsert(repoId, "app")
        val projectId2 = projectRepo.upsert(repoId, "packages/other")

        languageService.syncLanguages(projectId1, listOf("en", "da"))
        languageService.syncLanguages(projectId2, listOf("fr"))

        val langs1 = transaction {
            ProjectLangs.selectAll()
                .where { ProjectLangs.project eq projectId1 }
                .map { it[ProjectLangs.lang] }
        }
        val langs2 = transaction {
            ProjectLangs.selectAll()
                .where { ProjectLangs.project eq projectId2 }
                .map { it[ProjectLangs.lang] }
        }
        assertEquals(setOf("en", "da"), langs1.toSet())
        assertEquals(setOf("fr"), langs2.toSet())
    }
}
