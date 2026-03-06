package org.zetkin.lyra.backend.services

import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertIgnore
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.zetkin.lyra.backend.plugins.db.models.Langs
import org.zetkin.lyra.backend.plugins.db.models.ProjectLangs
import java.util.Locale

class LanguageService {

    fun syncLanguages(projectId: Int, languages: List<String>) = transaction {
        languages.forEach { code ->
            Langs.insertIgnore {
                it[Langs.id] = code
                it[Langs.name] = Locale.forLanguageTag(code).getDisplayLanguage(Locale.ENGLISH)
            }
        }

        ProjectLangs.deleteWhere {
            (ProjectLangs.project eq projectId) and (ProjectLangs.lang notInList languages)
        }

        languages.forEach { code ->
            ProjectLangs.insertIgnore {
                it[ProjectLangs.project] = projectId
                it[ProjectLangs.lang] = code
            }
        }
    }
}
