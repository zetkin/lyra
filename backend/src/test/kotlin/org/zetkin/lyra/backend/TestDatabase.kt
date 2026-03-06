package org.zetkin.lyra.backend

import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.zetkin.lyra.backend.plugins.db.DatabaseFactory

private const val TEST_DB_JDBC_URL = "jdbc:sqlite:src/test/resources/lyra_data_test.db"

object TestDatabase {
    private var initialized = false

    fun init() {
        if (!initialized) {
            DatabaseFactory.init(TEST_DB_JDBC_URL)
            initialized = true
        }
    }

    fun clearAll() = transaction {
        // Delete in FK-dependency order so no constraint violations occur
        exec("DELETE FROM translation")
        exec("DELETE FROM i18n_key")
        exec("DELETE FROM path")
        exec("DELETE FROM project_lang")
        exec("DELETE FROM lang")
        exec("DELETE FROM pull_request")
        exec("DELETE FROM project")
        exec("DELETE FROM repository")
        // Reset AUTOINCREMENT counters so IDs start at 1 in every test
        exec("DELETE FROM sqlite_sequence")
    }
}
