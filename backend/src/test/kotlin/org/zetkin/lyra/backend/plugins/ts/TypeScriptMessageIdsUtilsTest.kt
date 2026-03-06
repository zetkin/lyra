package org.zetkin.lyra.backend.plugins.ts

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class TypeScriptMessageIdsUtilsTest {

    // ── basic parsing ──────────────────────────────────────────────────────────

    @Test
    fun `single flat key`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('prefix', {
              hello: m('Hello world'),
            })
            """.trimIndent()
        )
        assertEquals(listOf(ParsedMessage("prefix.hello", "Hello world", emptyList())), result)
    }

    @Test
    fun `multiple flat keys`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              a: m('A'),
              b: m('B'),
              c: m('C'),
            })
            """.trimIndent()
        )
        assertEquals(3, result.size)
        assertEquals(listOf("ns.a", "ns.b", "ns.c"), result.map { it.key })
    }

    @Test
    fun `nested object`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              group: {
                key: m('text'),
              },
            })
            """.trimIndent()
        )
        assertEquals(listOf(ParsedMessage("ns.group.key", "text", emptyList())), result)
    }

    @Test
    fun `deeply nested object`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              a: {
                b: {
                  c: m('deep'),
                },
              },
            })
            """.trimIndent()
        )
        assertEquals(listOf(ParsedMessage("ns.a.b.c", "deep", emptyList())), result)
    }

    @Test
    fun `prefix applied at all nesting levels`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('zui', {
              snackbar: {
                error: m('Error'),
              },
            })
            """.trimIndent()
        )
        assertEquals("zui.snackbar.error", result.single().key)
    }

    @Test
    fun `flat and nested keys combined`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              flat: m('flat'),
              nested: {
                deep: m('deep'),
              },
              another: m('another'),
            })
            """.trimIndent()
        )
        assertEquals(listOf("ns.flat", "ns.nested.deep", "ns.another"), result.map { it.key })
    }

    // ── no makeMessages ────────────────────────────────────────────────────────

    @Test
    fun `file without makeMessages returns empty list`() {
        assertEquals(emptyList(), TypeScriptMessageIdsUtils.parseMessageIds("export const foo = 'bar';"))
    }

    @Test
    fun `empty content returns empty list`() {
        assertEquals(emptyList(), TypeScriptMessageIdsUtils.parseMessageIds(""))
    }

    // ── string formats ─────────────────────────────────────────────────────────

    @Test
    fun `empty string default text`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              empty: m(''),
            })
            """.trimIndent()
        )
        assertEquals(ParsedMessage("ns.empty", "", emptyList()), result.single())
    }

    @Test
    fun `double-quoted string`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages("ns", {
              key: m("double quoted"),
            })
            """.trimIndent()
        )
        assertEquals("double quoted", result.single().defaultText)
    }

    @Test
    fun `backtick string`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            "makeMessages('ns', {\n  key: m(`backtick text`),\n})"
        )
        assertEquals("backtick text", result.single().defaultText)
    }

    @Test
    fun `ICU format string with nested braces`() {
        val text = "{count, plural, =0 {none} other {{count} items}}"
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              msg: m('$text'),
            })
            """.trimIndent()
        )
        assertEquals(text, result.single().defaultText)
    }

    @Test
    fun `unicode curly quotes inside string are not treated as delimiters`() {
        // U+2018 LEFT SINGLE QUOTATION MARK, U+2019 RIGHT SINGLE QUOTATION MARK
        val innerQuotes = "\u2018{viewTitle}\u2019"
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              key: m('From  $innerQuotes'),
            })
            """.trimIndent()
        )
        assertEquals("From  $innerQuotes", result.single().defaultText)
    }

    @Test
    fun `backslash-escaped quote inside string`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              key: m('it\'s here'),
            })
            """.trimIndent()
        )
        assertEquals("it's here", result.single().defaultText)
    }

    // ── type parameters ────────────────────────────────────────────────────────

    @Test
    fun `no type param produces empty params list`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              key: m('text'),
            })
            """.trimIndent()
        )
        assertEquals(emptyList(), result.single().params)
    }

    @Test
    fun `single type param`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              greet: m<{ name: string }>('Hello {name}'),
            })
            """.trimIndent()
        )
        assertEquals(listOf("name"), result.single().params)
    }

    @Test
    fun `multiple type params separated by semicolon`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              msg: m<{ count: number; label: string }>('text'),
            })
            """.trimIndent()
        )
        assertEquals(listOf("count", "label"), result.single().params)
    }

    @Test
    fun `optional type param`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              msg: m<{ value?: string }>('text'),
            })
            """.trimIndent()
        )
        assertEquals(listOf("value"), result.single().params)
    }

    @Test
    fun `ReactElement type param does not extract type name as extra param`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              key: m<{ updated: ReactElement }>('Added {updated}'),
            })
            """.trimIndent()
        )
        // Only 'updated' — 'ReactElement' has no ':' after it so it is not extracted
        assertEquals(listOf("updated"), result.single().params)
    }

    @Test
    fun `mixed ReactElement and primitive params`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              key: m<{ sharer: string; updated: ReactElement }>('Added by {sharer} {updated}'),
            })
            """.trimIndent()
        )
        assertEquals(listOf("sharer", "updated"), result.single().params)
    }

    // ── multiline calls ────────────────────────────────────────────────────────

    @Test
    fun `multiline m() call`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              key: m(
                'long text on next line'
              ),
            })
            """.trimIndent()
        )
        assertEquals("long text on next line", result.single().defaultText)
    }

    @Test
    fun `multiline m() with type param`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              key: m<{ name: string }>(
                'Hello {name}'
              ),
            })
            """.trimIndent()
        )
        assertEquals(ParsedMessage("ns.key", "Hello {name}", listOf("name")), result.single())
    }

    // ── URL in string (// must not be treated as comment inside string) ────────

    @Test
    fun `double slash inside string value is not treated as line comment`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              link: m('https://example.com'),
              after: m('still here'),
            })
            """.trimIndent()
        )
        assertEquals(listOf("ns.link", "ns.after"), result.map { it.key })
        assertEquals("https://example.com", result[0].defaultText)
        assertEquals("still here", result[1].defaultText)
    }

    @Test
    fun `keys after a URL string are not silently dropped`() {
        // Regression: privacyPolicyLink: m('https://zetkin.org/privacy') caused
        // stripComments to eat the rest of the file, making snackbar keys disappear.
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('zui', {
              privacyPolicyLink: m('https://zetkin.org/privacy'),
              snackbar: {
                error: m('Oh dear, something went wrong'),
                info: m(''),
              },
            })
            """.trimIndent()
        )
        assertEquals(
            listOf("zui.privacyPolicyLink", "zui.snackbar.error", "zui.snackbar.info"),
            result.map { it.key },
        )
    }

    // ── comment stripping ──────────────────────────────────────────────────────

    @Test
    fun `single-line comment is stripped`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              // this is a comment: m('not a key'),
              key: m('text'),
            })
            """.trimIndent()
        )
        assertEquals(listOf(ParsedMessage("ns.key", "text", emptyList())), result)
    }

    @Test
    fun `block comment is stripped`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              /* skipped: m('not a key'), */
              key: m('text'),
            })
            """.trimIndent()
        )
        assertEquals(listOf(ParsedMessage("ns.key", "text", emptyList())), result)
    }

    @Test
    fun `block comment spanning multiple lines is stripped`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              /*
               * skipped: m('not a key'),
               */
              key: m('text'),
            })
            """.trimIndent()
        )
        assertEquals(listOf(ParsedMessage("ns.key", "text", emptyList())), result)
    }

    // ── property name formats ──────────────────────────────────────────────────

    @Test
    fun `quoted property name with hyphen`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              'hyphen-key': m('text'),
            })
            """.trimIndent()
        )
        assertEquals("ns.hyphen-key", result.single().key)
    }

    @Test
    fun `double-quoted property name`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              "quoted": m('text'),
            })
            """.trimIndent()
        )
        assertEquals("ns.quoted", result.single().key)
    }

    // ── robustness ────────────────────────────────────────────────────────────

    @Test
    fun `non-m value is skipped and surrounding keys are parsed`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              first: m('first'),
              skip: someOtherFn('ignored'),
              last: m('last'),
            })
            """.trimIndent()
        )
        assertEquals(listOf("ns.first", "ns.last"), result.map { it.key })
    }

    @Test
    fun `trailing comma after last entry`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              a: m('A'),
              b: m('B'),
            })
            """.trimIndent()
        )
        assertEquals(2, result.size)
    }

    // ── regression: snackbar after multiline m() call and typed generic sibling ─

    @Test
    fun `snackbar keys parsed correctly after multiline call and generic sibling`() {
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('zui', {
              publicFooter: {
                text: m(
                  'Zetkin is a platform for organizing activism.'
                ),
              },
              signUpChip: {
                callSignUp: m<{ name: string }>('{name} has signed up'),
                signedUp: m('You have signed up'),
              },
              snackbar: {
                error: m('Oh dear, something went wrong'),
                info: m(''),
                success: m('Success!'),
                warning: m('Warning!'),
              },
            })
            """.trimIndent()
        )

        val snackbar = result.filter { it.key.startsWith("zui.snackbar") }
        assertEquals(4, snackbar.size)
        assertTrue(snackbar.any { it.key == "zui.snackbar.error" && it.defaultText == "Oh dear, something went wrong" })
        assertTrue(snackbar.any { it.key == "zui.snackbar.info"    && it.defaultText == "" })
        assertTrue(snackbar.any { it.key == "zui.snackbar.success" && it.defaultText == "Success!" })
        assertTrue(snackbar.any { it.key == "zui.snackbar.warning" && it.defaultText == "Warning!" })
    }

    @Test
    fun `empty-string key followed by sibling is parsed correctly`() {
        // Ensures m('') does not confuse the parser for subsequent keys
        val result = TypeScriptMessageIdsUtils.parseMessageIds(
            """
            makeMessages('ns', {
              group: {
                blank: m(''),
                next: m('after blank'),
              },
            })
            """.trimIndent()
        )
        assertEquals(listOf("ns.group.blank", "ns.group.next"), result.map { it.key })
        assertEquals("", result[0].defaultText)
        assertEquals("after blank", result[1].defaultText)
    }
}
