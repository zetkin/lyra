package org.zetkin.lyra.backend.plugins.db

import io.netty.util.internal.StringUtil.EMPTY_STRING
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.v1.jdbc.Database
import kotlin.io.path.Path
import kotlin.io.path.absolutePathString

private const val LYRA_DATA_DB_FILENAME = "data/lyra_data.db"

object DatabaseFactory {

    fun init(jdbcUrl: String? = null) {
        val dbPath = Path(LYRA_DATA_DB_FILENAME)
        dbPath.parent?.toFile()?.mkdirs()
        val url = jdbcUrl ?: "jdbc:sqlite:${dbPath.absolutePathString()}"

        Flyway.configure()
            .dataSource(url, EMPTY_STRING, EMPTY_STRING) // SQLite doesn't need a user/pass
            .locations("classpath:db/migrations")
            .load()
            .migrate()

        Database.connect(url, driver = "org.sqlite.JDBC")
    }
}
