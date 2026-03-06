package org.zetkin.lyra.backend.repositories

import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.AfterAll
import org.zetkin.lyra.backend.TestDatabase
import org.zetkin.lyra.backend.plugins.db.models.I18nKeys
import org.zetkin.lyra.backend.plugins.git.RepositoryConfig
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class I18nKeyRepositoryTest {

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
    private val keyRepo = I18nKeyRepository()

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
    fun `upsert inserts a key and findIdByProjectAndValue finds it`() {
        val repoId = repoRepo.upsert(repoConfig)
        val projectId = projectRepo.upsert(repoId, "app")
        val pathId = pathRepo.findOrCreate(projectId, "src/l10n/messageIds.ts")

        keyRepo.upsert(projectId, pathId, "ns.greeting", "Hello world", emptyList())

        val keyId = keyRepo.findIdByProjectAndValue(projectId, "ns.greeting")
        assertNotNull(keyId)
    }

    @Test
    fun `upsert is idempotent`() {
        val repoId = repoRepo.upsert(repoConfig)
        val projectId = projectRepo.upsert(repoId, "app")
        val pathId = pathRepo.findOrCreate(projectId, "src/l10n/messageIds.ts")

        keyRepo.upsert(projectId, pathId, "ns.key", "text", emptyList())
        keyRepo.upsert(projectId, pathId, "ns.key", "updated text", emptyList())

        val rowCount = transaction {
            I18nKeys.selectAll().where { I18nKeys.value eq "ns.key" }.count()
        }
        assertEquals(1L, rowCount, "Expected exactly one i18n_key row after two upserts")
    }

    @Test
    fun `upsert updates defaultText on re-upsert`() {
        val repoId = repoRepo.upsert(repoConfig)
        val projectId = projectRepo.upsert(repoId, "app")
        val pathId = pathRepo.findOrCreate(projectId, "src/l10n/messageIds.ts")

        keyRepo.upsert(projectId, pathId, "ns.key", "original", emptyList())
        keyRepo.upsert(projectId, pathId, "ns.key", "updated", emptyList())

        val defaultText = transaction {
            I18nKeys.selectAll().where { I18nKeys.value eq "ns.key" }.single()[I18nKeys.defaultText]
        }
        assertEquals("updated", defaultText)
    }

    @Test
    fun `findIdByProjectAndValue returns null for unknown key`() {
        val repoId = repoRepo.upsert(repoConfig)
        val projectId = projectRepo.upsert(repoId, "app")

        val keyId = keyRepo.findIdByProjectAndValue(projectId, "ns.nonexistent")
        assertNull(keyId)
    }

    @Test
    fun `findParamsById returns params for a key with params`() {
        val repoId = repoRepo.upsert(repoConfig)
        val projectId = projectRepo.upsert(repoId, "app")
        val pathId = pathRepo.findOrCreate(projectId, "src/l10n/messageIds.ts")
        keyRepo.upsert(projectId, pathId, "ns.greeting", "Hello {name}", listOf("name"))

        val keyId = keyRepo.findIdByProjectAndValue(projectId, "ns.greeting")!!
        assertEquals(listOf("name"), keyRepo.findParamsById(keyId))
    }

    @Test
    fun `findParamsById returns empty list for a key without params`() {
        val repoId = repoRepo.upsert(repoConfig)
        val projectId = projectRepo.upsert(repoId, "app")
        val pathId = pathRepo.findOrCreate(projectId, "src/l10n/messageIds.ts")
        keyRepo.upsert(projectId, pathId, "ns.simple", "Hello", emptyList())

        val keyId = keyRepo.findIdByProjectAndValue(projectId, "ns.simple")!!
        assertEquals(emptyList(), keyRepo.findParamsById(keyId))
    }

    @Test
    fun `findIdByProjectAndValue is scoped to project`() {
        val repoId = repoRepo.upsert(repoConfig)
        val projectId1 = projectRepo.upsert(repoId, "app")
        val projectId2 = projectRepo.upsert(repoId, "packages/other")

        val pathId1 = pathRepo.findOrCreate(projectId1, "src/l10n/messageIds.ts")
        keyRepo.upsert(projectId1, pathId1, "ns.key", "text", emptyList())

        // Key inserted under project 1 must not be found under project 2
        assertNull(keyRepo.findIdByProjectAndValue(projectId2, "ns.key"))
    }
}
