package org.zetkin.lyra.backend.services

import com.charleskorn.kaml.Yaml
import com.charleskorn.kaml.YamlMap
import com.charleskorn.kaml.YamlNode
import com.charleskorn.kaml.YamlNull
import com.charleskorn.kaml.YamlScalar

private val yaml = Yaml()

fun flattenYamlNode(node: YamlNode, prefix: String): Map<String, String> = buildMap {
    when (node) {
        is YamlMap -> node.entries.forEach { (key, value) ->
            val fullKey = if (prefix.isEmpty()) key.content else "$prefix.${key.content}"
            putAll(flattenYamlNode(value, fullKey))
        }
        is YamlScalar -> put(prefix, node.content)
        is YamlNull -> {}
        else -> {}
    }
}

fun buildNestedMap(flat: Map<String, String>): Map<String, Any> {
    val result = mutableMapOf<String, Any>()
    for ((dotKey, value) in flat) {
        val parts = dotKey.split(".")
        var current = result
        for (i in 0 until parts.size - 1) {
            @Suppress("UNCHECKED_CAST")
            current = current.getOrPut(parts[i]) { mutableMapOf<String, Any>() } as MutableMap<String, Any>
        }
        current[parts.last()] = value
    }
    return result
}

fun renderYaml(map: Map<String, Any>, indent: Int = 0): String = buildString {
    val prefix = "  ".repeat(indent)
    for ((key, value) in map) {
        when (value) {
            is String -> {
                val escaped = value
                    .replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\t", "\\t")
                append("$prefix$key: $escaped\n")
            }
            is Map<*, *> -> {
                append("$prefix$key:\n")
                @Suppress("UNCHECKED_CAST")
                append(renderYaml(value as Map<String, Any>, indent + 1))
            }
        }
    }
}

/**
 * Patches [existingYaml] in place: only lines whose dot-path key is present in [updates] are
 * rewritten; all other lines are preserved verbatim. Keys not found in the existing file are
 * inserted under their deepest existing ancestor (rather than appended as new root-level blocks).
 * This minimises the diff produced when committing translations to git.
 */
fun patchYamlTranslations(existingYaml: String, updates: Map<String, String>): String {
    if (existingYaml.isBlank()) return renderYaml(buildNestedMap(updates))

    val remaining = updates.toMutableMap()
    val lines = existingYaml.split("\n").toMutableList()

    // Pass 1: replace / update keys that already exist in the file
    var i = 0
    var pathStack = mutableListOf<Pair<String, Int>>()
    while (i < lines.size) {
        val line = lines[i]
        val trimmed = line.trimStart()
        if (trimmed.isBlank() || trimmed.startsWith("#")) { i++; continue }
        val indent = line.length - trimmed.length
        while (pathStack.isNotEmpty() && pathStack.last().second >= indent) pathStack.removeLast()
        val colonIdx = trimmed.indexOf(':')
        if (colonIdx < 0) { i++; continue }
        val key = trimmed.substring(0, colonIdx)
        val valueStr = trimmed.substring(colonIdx + 1).trimStart()
        val dotKey = (pathStack.map { it.first } + key).joinToString(".")

        when {
            valueStr.isEmpty() -> {
                pathStack.add(key to indent)
                i++
            }
            valueStr.startsWith("|") || valueStr.startsWith(">") -> {
                var j = i + 1
                while (j < lines.size) {
                    val bl = lines[j]
                    if (bl.isBlank()) { j++; continue }
                    if (bl.length - bl.trimStart().length > indent) j++ else break
                }
                if (dotKey in remaining) {
                    val newValue = remaining.remove(dotKey)!!
                    repeat(j - i) { lines.removeAt(i) }
                    lines.add(i, "${" ".repeat(indent)}$key: ${formatInlineValue(newValue, "")}")
                    i++
                } else {
                    i = j
                }
            }
            else -> {
                if (dotKey in remaining) {
                    val newValue = remaining.remove(dotKey)!!
                    lines[i] = "${" ".repeat(indent)}$key: ${formatInlineValue(newValue, valueStr)}"
                }
                i++
            }
        }
    }

    if (remaining.isEmpty()) return lines.joinToString("\n")

    // Pass 2: re-index all mapping nodes from the (now-updated) lines
    val mappingIndex = mutableMapOf<String, Int>() // dot-key → line index
    i = 0
    pathStack = mutableListOf()
    while (i < lines.size) {
        val line = lines[i]
        val trimmed = line.trimStart()
        if (trimmed.isBlank() || trimmed.startsWith("#")) { i++; continue }
        val indent = line.length - trimmed.length
        while (pathStack.isNotEmpty() && pathStack.last().second >= indent) pathStack.removeLast()
        val colonIdx = trimmed.indexOf(':')
        if (colonIdx < 0) { i++; continue }
        val key = trimmed.substring(0, colonIdx)
        val valueStr = trimmed.substring(colonIdx + 1).trimStart()
        val dotKey = (pathStack.map { it.first } + key).joinToString(".")
        if (valueStr.isEmpty()) {
            mappingIndex[dotKey] = i
            pathStack.add(key to indent)
        } else if (valueStr.startsWith("|") || valueStr.startsWith(">")) {
            var j = i + 1
            while (j < lines.size) {
                val bl = lines[j]
                if (bl.isBlank()) { j++; continue }
                if (bl.length - bl.trimStart().length > indent) j++ else break
            }
            i = j
            continue
        }
        i++
    }

    // Pass 3: insert remaining keys under their deepest existing ancestor
    data class InsertionGroup(val startDepth: Int, val keys: MutableMap<String, String>)
    val insertionsByLine = mutableMapOf<Int, InsertionGroup>()

    for ((dotKey, newValue) in remaining) {
        val parts = dotKey.split(".")
        var ancestorDepth = 0
        var insertLine = lines.indexOfLast { it.isNotBlank() } + 1
        var startDepth = 0

        for (depth in parts.size - 1 downTo 1) {
            val ancestorKey = parts.subList(0, depth).joinToString(".")
            val ancestorLineIdx = mappingIndex[ancestorKey] ?: continue
            val ancestorIndent = lines[ancestorLineIdx].length - lines[ancestorLineIdx].trimStart().length

            // Find where this ancestor's block ends
            var end = ancestorLineIdx + 1
            while (end < lines.size) {
                val bl = lines[end]
                if (bl.isBlank()) { end++; continue }
                if (bl.length - bl.trimStart().length > ancestorIndent) end++ else break
            }
            // Back up past any trailing blank lines within the block
            while (end > ancestorLineIdx + 1 && lines[end - 1].isBlank()) end--

            ancestorDepth = depth
            insertLine = end
            startDepth = (ancestorIndent + 2) / 2
            break
        }

        val group = insertionsByLine.getOrPut(insertLine) { InsertionGroup(startDepth, mutableMapOf()) }
        val relativeKey = parts.subList(ancestorDepth, parts.size).joinToString(".")
        group.keys[relativeKey] = newValue
    }

    // Apply insertions from bottom to top to preserve line indices
    for ((insertLine, group) in insertionsByLine.toSortedMap(reverseOrder())) {
        val rendered = renderYaml(buildNestedMap(group.keys), group.startDepth).trimEnd()
        lines.addAll(insertLine, rendered.split("\n"))
    }

    // Ensure trailing newline
    if (lines.isEmpty() || lines.last().isNotBlank()) lines.add("")
    return lines.joinToString("\n")
}

private fun formatInlineValue(newValue: String, originalStyle: String): String = when {
    originalStyle.startsWith('"') ->
        "\"${newValue.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n")}\""
    originalStyle.startsWith('\'') ->
        "'${newValue.replace("'", "''")}'"
    else -> newValue
}
