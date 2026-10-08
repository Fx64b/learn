import { type JSONSchema7, type Schema, jsonSchema } from 'ai'
import { z } from 'zod'

type Node = JSONSchema7 | boolean

const DROPPED_KEYWORDS = [
    '$schema',
    'additionalProperties',
    'minItems',
    'maxItems',
] as const

const isNullType = (node: Node) =>
    typeof node === 'object' && node.type === 'null'

/**
 * Strips a JSON Schema down to the subset Gemini handles well: type,
 * properties, required, items, enum and description.
 *
 * Gemini rejects a `responseJsonSchema` that is too complex with a bare
 * "400 Request contains an invalid argument", without naming a field
 * (https://github.com/vercel/ai/issues/21192). Array bounds and `null`
 * branches are the costly parts. Optional fields stay optional because
 * they are not in `required`.
 */
export function leanGeminiSchema(node: Node): Node {
    if (typeof node === 'boolean') return node

    const { anyOf, type, properties, items, ...rest } = node
    for (const key of DROPPED_KEYWORDS) delete rest[key]

    // `X | null` becomes `X`.
    const nonNull = anyOf?.filter((branch) => !isNullType(branch))
    if (nonNull?.length === 1 && typeof nonNull[0] === 'object') {
        return leanGeminiSchema({ ...rest, ...nonNull[0] })
    }

    const types = Array.isArray(type) ? type.filter((t) => t !== 'null') : type
    const result: JSONSchema7 = { ...rest }
    if (types !== undefined) {
        result.type =
            Array.isArray(types) && types.length === 1 ? types[0] : types
    }
    if (nonNull) result.anyOf = nonNull.map(leanGeminiSchema)
    if (properties) {
        result.properties = Object.fromEntries(
            Object.entries(properties).map(([key, value]) => [
                key,
                leanGeminiSchema(value),
            ])
        )
    }
    if (items !== undefined) {
        result.items = Array.isArray(items)
            ? items.map(leanGeminiSchema)
            : leanGeminiSchema(items)
    }
    return result
}

/**
 * Output schema for Gemini: the model gets the lean JSON Schema, and the
 * answer is still validated against the full zod schema.
 */
export function geminiOutputSchema<T>(schema: z.ZodType<T>): Schema<T> {
    const full = z.toJSONSchema(schema, {
        io: 'input',
        target: 'draft-7',
    }) as JSONSchema7
    return jsonSchema<T>(leanGeminiSchema(full) as JSONSchema7, {
        validate: (value) => {
            const parsed = schema.safeParse(value)
            return parsed.success
                ? { success: true, value: parsed.data }
                : { success: false, error: parsed.error }
        },
    })
}
