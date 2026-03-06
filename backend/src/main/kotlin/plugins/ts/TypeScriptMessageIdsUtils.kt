package org.zetkin.lyra.backend.plugins.ts

import java.nio.file.Path
import kotlin.io.path.readText


data class ParsedMessage(
    val key: String,
    val defaultText: String,
    val params: List<String>,
)

/**
 * Parses a TypeScript `messageIds.ts` file and extracts all i18n message definitions.
 *
 * Handles the following format:
 * ```ts
 *  export default makeMessages('prefix', {
 *     key: m('default text'),
 *     keyWithParams: m<{ paramName: string }>('text with {paramName}'),
 *     nested: {
 *       key: m('another'),
 *     },
 *   });
 * ```
 * Produces keys in dot notation: prefix.key, prefix.keyWithParams, prefix.nested.key
 */
object TypeScriptMessageIdsUtils {

    fun parseMessageIds(messageIdsFile: Path): List<ParsedMessage> = parseMessageIds(messageIdsFile.readText())

    fun parseMessageIds(messageIdsContent: String): List<ParsedMessage> {
        val cleaned = stripComments(messageIdsContent)
        val match = Regex("""makeMessages\(\s*['"]([^'"]+)['"]\s*,""").find(cleaned) ?: return emptyList()
        val prefix = match.groupValues[1]
        var pos = match.range.last + 1
        while (pos < cleaned.length && cleaned[pos] != '{') pos++
        if (pos >= cleaned.length) return emptyList()
        return parseObject(cleaned, pos + 1, prefix).messages
    }

    private fun stripComments(content: String): String {
        val sb = StringBuilder(content.length)
        var i = 0
        while (i < content.length) {
            when {
                // String literal — copy verbatim so that // or /* inside strings are never
                // mistaken for comment markers (e.g. m('https://example.com')).
                content[i] == '\'' || content[i] == '"' || content[i] == '`' -> {
                    val quote = content[i]
                    sb.append(content[i++])
                    while (i < content.length) {
                        when {
                            content[i] == '\\' && i + 1 < content.length -> {
                                sb.append(content[i++]); sb.append(content[i++])
                            }
                            content[i] == quote -> { sb.append(content[i++]); break }
                            else -> sb.append(content[i++])
                        }
                    }
                }
                i + 1 < content.length && content[i] == '/' && content[i + 1] == '/' -> {
                    while (i < content.length && content[i] != '\n') i++
                }
                i + 1 < content.length && content[i] == '/' && content[i + 1] == '*' -> {
                    i += 2
                    while (i + 1 < content.length && !(content[i] == '*' && content[i + 1] == '/')) i++
                    if (i + 1 < content.length) i += 2
                }
                else -> sb.append(content[i++])
            }
        }
        return sb.toString()
    }

    private data class ObjectResult(val messages: List<ParsedMessage>, val endPos: Int)

    private fun parseObject(content: String, startPos: Int, prefix: String): ObjectResult {
        val results = mutableListOf<ParsedMessage>()
        var pos = startPos

        while (pos < content.length) {
            pos = skipWhitespace(content, pos)
            if (pos >= content.length) break

            when (content[pos]) {
                '}' -> return ObjectResult(results, pos + 1)
                ',' -> {
                    pos++; continue
                }

                else -> {
                    val (propName, posAfterName) = parsePropName(content, pos)
                    if (propName == null) {
                        pos++; continue
                    }
                    pos = posAfterName

                    pos = skipWhitespace(content, pos)
                    if (pos < content.length && content[pos] == ':') pos++
                    pos = skipWhitespace(content, pos)

                    val fullKey = "$prefix.$propName"

                    when {
                        pos < content.length && content[pos] == '{' -> {
                            val result = parseObject(content, pos + 1, fullKey)
                            results.addAll(result.messages)
                            pos = result.endPos
                        }

                        pos + 1 < content.length && content[pos] == 'm' && (content[pos + 1] == '(' || content[pos + 1] == '<') -> {
                            val (msg, newPos) = parseMessageCall(content, pos, fullKey)
                            if (msg != null) results.add(msg)
                            pos = newPos
                        }

                        else -> pos = skipValue(content, pos)
                    }
                }
            }
        }

        return ObjectResult(results, pos)
    }

    private fun skipWhitespace(content: String, pos: Int): Int {
        var i = pos
        while (i < content.length && content[i].isWhitespace()) i++
        return i
    }

    private fun parsePropName(content: String, pos: Int): Pair<String?, Int> {
        var i = pos
        if (i >= content.length) return Pair(null, i)

        if (content[i] == '\'' || content[i] == '"') {
            val (text, newPos) = readString(content, i)
            return Pair(text, newPos)
        }

        val sb = StringBuilder()
        while (i < content.length && (content[i].isLetterOrDigit() || content[i] == '_')) {
            sb.append(content[i++])
        }
        return if (sb.isEmpty()) Pair(null, i) else Pair(sb.toString(), i)
    }

    private fun parseMessageCall(content: String, pos: Int, key: String): Pair<ParsedMessage?, Int> {
        var i = pos + 1 // skip 'm'
        val params = mutableListOf<String>()

        if (i < content.length && content[i] == '<') {
            val (typeBlock, newPos) = readUntilClosingAngle(content, i + 1)
            i = newPos
            Regex("""([a-zA-Z_][a-zA-Z0-9_]*)\s*[?]?\s*:""").findAll(typeBlock).forEach { match ->
                params.add(match.groupValues[1])
            }
        }

        i = skipWhitespace(content, i)
        if (i < content.length && content[i] == '(') i++
        i = skipWhitespace(content, i)

        if (i >= content.length || (content[i] != '\'' && content[i] != '"' && content[i] != '`')) {
            return Pair(null, i)
        }

        val (text, posAfterStr) = readString(content, i)
        i = posAfterStr

        // skip to closing )
        i = skipWhitespace(content, i)
        if (i < content.length && content[i] == ')') i++

        return Pair(ParsedMessage(key, text, params), i)
    }

    private fun readUntilClosingAngle(content: String, pos: Int): Pair<String, Int> {
        val sb = StringBuilder()
        var i = pos
        var depth = 1
        while (i < content.length && depth > 0) {
            when (content[i]) {
                '<' -> {
                    depth++; sb.append(content[i])
                }

                '>' -> {
                    depth--; if (depth > 0) sb.append(content[i])
                }

                else -> sb.append(content[i])
            }
            i++
        }
        return Pair(sb.toString(), i)
    }

    private fun readString(content: String, pos: Int): Pair<String, Int> {
        val quote = content[pos]
        var i = pos + 1
        val sb = StringBuilder()
        while (i < content.length) {
            when {
                content[i] == '\\' && i + 1 < content.length -> {
                    sb.append(content[i + 1]); i += 2
                }

                content[i] == quote -> {
                    i++; break
                }

                else -> sb.append(content[i++])
            }
        }
        return Pair(sb.toString(), i)
    }

    private fun skipValue(content: String, pos: Int): Int {
        var i = pos
        var depth = 0
        while (i < content.length) {
            when (content[i]) {
                '{', '(' -> {
                    depth++; i++
                }

                '}', ')' -> {
                    if (depth == 0) break
                    depth--; i++
                }

                ',' -> if (depth == 0) break else i++
                '\'', '"', '`' -> {
                    val (_, newPos) = readString(content, i); i = newPos
                }

                else -> i++
            }
        }
        return i
    }
}
