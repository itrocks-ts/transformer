import { isAnyObject, KeyOf } from '@itrocks/class-type'
import { ObjectOrType }       from '@itrocks/class-type'
import { prototypeOf }        from '@itrocks/class-type'
import { Type, typeOf }       from '@itrocks/class-type'
import { DecoratorOfType }    from '@itrocks/decorator/class'
import { PrimitiveType }      from '@itrocks/property-type'
import { ReflectProperty }    from '@itrocks/reflect'

export { Transform } from './transform'

const TRANSFORMERS = Symbol('transformers')

export const ALL    = null
export const EDIT   = 'edit'
export const INPUT  = 'input'
export const OUTPUT = 'output'
export const READ   = 'read'
export const SAVE   = 'save'

export const HTML = 'html'
export const JSON = 'json'
export const SQL  = 'sql'

export type Direction = 'edit' | 'input' | 'output' | 'read' | 'save' | string | symbol | ''
export type Format    = 'html' | 'json' | 'sql' | string | symbol | ''

export const IGNORE = '¤~!~!~!~!~¤'

type PropertyType<PT extends object = object> = DecoratorOfType<PT> | PrimitiveType | Type<PT> | null

type DirectionTransformers<T extends object = object> = Record<Direction, Transformer<T>>
type FormatTransformers<T extends object = object>    = Record<Format, DirectionTransformers<T>>
const transformers = new Map<PropertyType, FormatTransformers>()

export type FormatTransformer = (value: any, data: any) => any
const formatTransformers = new Map<string | symbol, FormatTransformer>

export type Transformer<T extends object = object>
	= (value: any, target: ObjectOrType<T>, property: KeyOf<T>, data: any, format: Format, direction: Direction) => any

export type Transformers<T extends object = object>
	= { format?: Format, direction?: Direction, transformer: Transformer<T> }[]

export async function applyTransformer<T extends object>(
	value: any, target: ObjectOrType<T>, property: KeyOf<T>, format: Format, direction: Direction, data?: any
) {
	const object = prototypeOf(target)
	let   transformer = getPropertyTransformer<T>(object, property, format, direction)
	if (transformer === undefined) {
		const propertyType = new ReflectProperty(target, property).type
		transformer = setPropertyTransformer(
			object, property, format, direction,
			(
				propertyType
					? (
						getPropertyTypeTransformer(propertyType, format, direction)
						|| getPropertyTypeTransformer(ALL, format, direction)
						|| false
					)
					: false
			) as (Transformer<T> | false)
		)
	}
	const formatTransformer = formatTransformers.get(format)
	const result       = transformer ? await transformer(value, target, property, data, format, direction) : value
	return (data && formatTransformer) ? formatTransformer(result, data) : result
}

function getPropertyTransformer<T extends object>(object: T, property: KeyOf<T>, format: Format, direction: Direction)
	: Transformer<T> | false | undefined
{
	const formatTransformers = Reflect.getMetadata(TRANSFORMERS, object, property)
	if (!formatTransformers) return
	const directionTransformers = formatTransformers[format] ?? formatTransformers['']
	if (!directionTransformers) return
	return directionTransformers[direction] ?? directionTransformers['']
}

function getPropertyTypeTransformer(type: PropertyType, format: Format, direction: Direction)
{
	const formatTransformers = transformers.get(isAnyObject(type) ? typeOf(type) : type)
	if (!formatTransformers) return
	const directionTransformers = formatTransformers[format] ?? formatTransformers['']
	if (!directionTransformers) return
	return directionTransformers[direction] ?? directionTransformers['']
}

export function setFormatTransformer(format: Format, transformer: FormatTransformer)
{
	formatTransformers.set(format, transformer)
}

export function setPropertyTransformer<T extends object>(
	target: ObjectOrType<T>, property: KeyOf<T>, format: Format, direction: Direction, transformer: Transformer<T> | false
) {
	target = prototypeOf(target)
	let propertyTransformers = Reflect.getMetadata(TRANSFORMERS, target, property)
	if (!propertyTransformers) {
		Reflect.defineMetadata(TRANSFORMERS, propertyTransformers = {}, target, property)
	}
	let formatTransformers = propertyTransformers[format] ?? (propertyTransformers[format] = {})
	formatTransformers[direction] = transformer
	return transformer
}

export function setPropertyTransformers<T extends object>(
	target: ObjectOrType<T>, property: KeyOf<T>, transformers: Transformers<T>
) {
	for (const transformer of transformers) {
		setPropertyTransformer(
			target, property, transformer.format ?? '', transformer.direction ?? '', transformer.transformer
		)
	}
}

export function setPropertyTypeTransformer<T extends object>(
	type: PropertyType, format: Format, direction: Direction, transformer: Transformer<T>
) {
	let propertyTransformers = transformers.get(type) as unknown as FormatTransformers<T>
	if (!propertyTransformers) {
		transformers.set(type, propertyTransformers = {})
	}
	let formatTransformers = propertyTransformers[format] ?? (propertyTransformers[format] = {})
	formatTransformers[direction] = transformer
}

export function setPropertyTypeTransformers<T extends object>(type: PropertyType, transformers: Transformers<T>)
{
	for (const transformer of transformers) {
		setPropertyTypeTransformer(type, transformer.format ?? '', transformer.direction ?? '', transformer.transformer)
	}
}
