package org.zetkin.lyra.backend.services

import com.charleskorn.kaml.Yaml
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import org.zetkin.lyra.backend.logger
import org.zetkin.lyra.backend.plugins.db.models.TranslationState
import org.zetkin.lyra.backend.plugins.git.LyraProjectConfig
import org.zetkin.lyra.backend.repositories.I18nKeyRepository
import org.zetkin.lyra.backend.repositories.TranslationRepository
import java.nio.file.Path
import kotlin.io.path.exists
import kotlin.io.path.readText

private val yaml = Yaml()

class TranslationSyncService : KoinComponent {
    private val i18nKeyRepo: I18nKeyRepository by inject()
    private val translationRepo: TranslationRepository by inject()
    private val log = logger()

    fun sync(projectId: Int, projectDir: Path, lyraProject: LyraProjectConfig) {
        val translationsDir = projectDir.resolve(lyraProject.translations.path).normalize()
        log.info("Syncing translations from $translationsDir")

        // Single query for all key IDs — used for every language below
        val keyIds = i18nKeyRepo.findKeyIdsByProject(projectId)

        lyraProject.languages.forEach { lang ->
            val ymlFile = translationsDir.resolve("$lang.yml")
            check(ymlFile.exists()) {
                "Translation file not found for lang '$lang': $ymlFile"
            }

            val entries = flattenYamlNode(yaml.parseToYamlNode(ymlFile.readText()), "")
            log.info("Found ${entries.size} translation entries for lang '$lang'")

            val presentKeyIds = mutableSetOf<Int>()
            val missingKeys = mutableSetOf<String>()
            entries.forEach { (i18nKey, text) ->
                val keyId = keyIds[i18nKey]
                if (keyId == null) {
                    missingKeys += i18nKey
                    return@forEach
                }
                translationRepo.upsert(keyId, lang, text, TranslationState.PUBLISHED)
                presentKeyIds += keyId
            }
            if (missingKeys.isNotEmpty()) {
                log.warn(
                    "No i18n_keys found for ${missingKeys.size} entries within ${
                        ymlFile.normalize().toAbsolutePath()
                    } " +
                            "($projectId, lang=$lang):\n${missingKeys.joinToString(",\n")}"
                )
            }


            val staleCount = translationRepo.deleteStaleForProjectAndLang(projectId, lang, presentKeyIds)
            if (staleCount > 0) {
                log.info("Deleted $staleCount stale translations for lang '$lang' in project $projectId")
            }
        }
    }

}
