package org.zetkin.lyra.backend.plugins.ts

class MessageIdsParser {
    fun parse(content: String): List<ParsedMessage> =
        TypeScriptMessageIdsUtils.parseMessageIds(content)
}
