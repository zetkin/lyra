package org.zetkin.lyra.backend.services

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class YamlTranslationWriterTest {

    // ── renderYaml ───────────────────────────────────────────────────────────────

    @Test
    fun `single flat key`() {
        val result = renderYaml(buildNestedMap(mapOf("greeting" to "Hello")))
        assertEquals("greeting: Hello\n", result)
    }

    @Test
    fun `nested key`() {
        val result = renderYaml(buildNestedMap(mapOf("a.b" to "hi")))
        assertEquals("a:\n  b: hi\n", result)
    }

    @Test
    fun `sibling keys share parent node`() {
        val result = renderYaml(buildNestedMap(mapOf("a.b" to "1", "a.c" to "2")))
        assertEquals("a:\n  b: 1\n  c: 2\n", result)
    }

    @Test
    fun `deep nesting three levels`() {
        val result = renderYaml(buildNestedMap(mapOf("x.y.z" to "deep")))
        assertEquals("x:\n  y:\n    z: deep\n", result)
    }

    @Test
    fun `double quote in value is escaped`() {
        val result = renderYaml(buildNestedMap(mapOf("key" to "say \"hi\"")))
        assertEquals("key: say \\\"hi\\\"\n", result)
    }

    @Test
    fun `newline in value is escaped`() {
        val result = renderYaml(buildNestedMap(mapOf("key" to "line1\nline2")))
        assertEquals("key: line1\\nline2\n", result)
    }

    // ── patchYamlTranslations — in-place updates ─────────────────────────────────

    @Test
    fun `updates existing key in place`() {
        val existing = "a: old\nb: unchanged\n"
        val result = patchYamlTranslations(existing, mapOf("a" to "new"))
        assertEquals("a: new\nb: unchanged\n", result)
    }

    @Test
    fun `preserves double-quoted style`() {
        val existing = "a: \"old value\"\n"
        val result = patchYamlTranslations(existing, mapOf("a" to "new value"))
        assertEquals("a: \"new value\"\n", result)
    }

    @Test
    fun `preserves single-quoted style`() {
        val existing = "a: 'old value'\n"
        val result = patchYamlTranslations(existing, mapOf("a" to "new value"))
        assertEquals("a: 'new value'\n", result)
    }

    @Test
    fun `updates nested key without touching siblings`() {
        val existing = "parent:\n  child: old\n  sibling: kept\n"
        val result = patchYamlTranslations(existing, mapOf("parent.child" to "new"))
        assertEquals("parent:\n  child: new\n  sibling: kept\n", result)
    }

    @Test
    fun `replaces block scalar with inline value`() {
        val existing = "a: |\n  line one\n  line two\nb: kept\n"
        val result = patchYamlTranslations(existing, mapOf("a" to "new value"))
        assertEquals("a: new value\nb: kept\n", result)
    }

    // ── patchYamlTranslations — new key insertion ────────────────────────────────

    @Test
    fun `inserts new sibling key under existing parent — no duplicate root block`() {
        // Mirrors the real failure: feat.emails exists, feat.emails.urlCard does not
        val existing = "feat:\n  emails:\n    blocked: x\n  organizations:\n    y: z\n"
        val result = patchYamlTranslations(existing, mapOf("feat.emails.urlCard.nowAccepting" to "link"))

        // Must NOT create a second feat: block at the end
        val rootFeatLines = result.lines().filter { it == "feat:" }
        assertEquals(1, rootFeatLines.size, "Should have exactly one root feat: key")

        // New key must be indented under feat.emails (4 spaces for urlCard, 6 for nowAccepting)
        assertTrue(result.contains("    urlCard:\n      nowAccepting: link"), "urlCard block should be nested under emails")

        // Siblings must be preserved
        assertTrue(result.contains("    blocked: x"))
        assertTrue(result.contains("  organizations:\n    y: z"))
    }

    @Test
    fun `inserts new child under deeply nested existing parent`() {
        val existing = "feat:\n  org:\n    page:\n      title: T\n      footer: F\n"
        val result = patchYamlTranslations(existing, mapOf("feat.org.page.contactPerson.default" to "Bob"))

        val rootFeatLines = result.lines().filter { it == "feat:" }
        assertEquals(1, rootFeatLines.size)
        assertTrue(result.contains("      contactPerson:\n        default: Bob"))
        assertTrue(result.contains("      title: T"))
        assertTrue(result.contains("      footer: F"))
    }

    @Test
    fun `appends truly new root key at end of file`() {
        val existing = "a: existing\n"
        val result = patchYamlTranslations(existing, mapOf("b" to "added"))
        assertTrue(result.contains("a: existing"))
        assertTrue(result.contains("b: added"))
        assertFalse(result.startsWith("b:"), "New root key should come after existing content")
    }

    @Test
    fun `empty existing falls back to renderYaml`() {
        val result = patchYamlTranslations("", mapOf("greeting" to "Hello"))
        assertEquals("greeting: Hello\n", result)
    }

    @Test
    fun `leaves unmodified keys verbatim`() {
        val existing = "x: 10\ny: 20\n"
        val result = patchYamlTranslations(existing, mapOf("y" to "99"))
        assertEquals("x: 10\ny: 99\n", result)
    }
}
