package org.zetkin.lyra.backend.plugins.db.models

import kotlinx.serialization.Serializable

@Serializable
enum class TranslationState {
    /** Translation is live on the base branch. */
    PUBLISHED,
    /** Submitted by a user via the Lyra UI, not yet in a pull request. */
    SUBMITTED,
    /** Included in an open pull request. */
    PART_OF_PULL_REQUEST,
}
