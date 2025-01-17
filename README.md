[![npm version](https://img.shields.io/npm/v/@itrocks/transformer?logo=npm)](https://www.npmjs.org/package/@itrocks/transformer)
[![npm downloads](https://img.shields.io/npm/dm/@itrocks/transformer)](https://www.npmjs.org/package/@itrocks/transformer)
[![GitHub](https://img.shields.io/github/last-commit/itrocks-ts/transformer?color=2dba4e&label=commit&logo=github)](https://github.com/itrocks-ts/transformer)
[![issues](https://img.shields.io/github/issues/itrocks-ts/transformer)](https://github.com/itrocks-ts/transformer/issues)
[![discord](https://img.shields.io/discord/1314141024020467782?color=7289da&label=discord&logo=discord&logoColor=white)](https://25.re/ditr)

# transformer

Transform property values dynamically, enabling data formatting for versatile use cases.

## Overview

This library provide tools to define and apply property transformers dynamically.

Features include:
- Applying transformers to properties via a single decorator.
- Associating transformers with property types and classes.

## Usage Examples

### Defining Transformers for Primitive Types

Default transformers for `boolean`, `Date`, and `number` types:
```ts
import { HTML, EDIT, INPUT, OUTPUT }   from '@itrocks/transformer'
import { setPropertyTypeTransformers } from '@itrocks/transformer'
import { format, parse }               from 'date-fns'

// boolean
setPropertyTypeTransformers(Boolean, [
	{ format: HTML, direction: EDIT,   transformer: value => `<input type="checkbox" ${value ? 'checked' : ''} value="true">` },
	{ format: HTML, direction: INPUT,  transformer: value => value === 'true' },
	{ format: HTML, direction: OUTPUT, transformer: value => value ? 'yes' : 'no' }
])

// Date
setPropertyTypeTransformers(Date, [
	{ format: HTML, direction: EDIT,   transformer: value => `<input type="date" value="${format(value, 'yyyy-MM-dd')}">` },
	{ format: HTML, direction: INPUT,  transformer: value => parse(value, 'yyyy-MM-dd', new Date()) },
	{ format: HTML, direction: OUTPUT, transformer: value => format(value, 'yyyy-MM-dd') }
])

// number
setPropertyTypeTransformers(Number, [
	{ format: HTML, direction: EDIT,  transformer: value => `<input type="number" value="${value}">` },
	{ format: HTML, direction: INPUT, transformer: value => parseFloat(value) }
])
```

### Using the [@Transform](#transform) decorator

Apply specific transformer functions to properties: 
```ts
import { EDIT, HTML, INPUT } from '@itrocks/transformer'
import { Transform }         from '@itrocks/transformer'

class User
{
	@Transform(HTML, EDIT, (value) => `<input type="text" value="${value}">`)
	name: string

	@Transform([
		{ format: HTML, direction: EDIT,  transformer: () => `<input type="password">` },
		{ format: HTML, direction: INPUT, transformer: value => value.length ? 'hashed-value' : '' }
	])
	password: string
}
```

### Applying Transformers

Use transformers to process incoming data:
```ts
import { applyTransformer } from '@itrocks/transformer'
import { HTML, INPUT }      from '@itrocks/transformer'

async function saveForm(data, target) {
	for (const property in data) {
		const transformedValue = await applyTransformer(
			data[property], target, property, HTML, INPUT, data
		)
		if (transformedValue !== undefined) target[property] = transformedValue
	}
}
```

## API

### Constants

- `ALL`:    A special constant representing all property types.
- `EDIT`:   Indicates a transformation intended for editing purposes.
- `INPUT`:  Represents transformations applied to data input.
- `OUTPUT`: Denotes transformations used for outputting data.
- `READ`:   Used when reading data from an external source.
- `SAVE`:   Indicates transformations used for saving data.
- `HTML`, `JSON`, `SQL`: Constants representing specific data formats.

### Types

- `Direction`:
  Specifies the purpose of a transformation:
  ```ts
  type Direction = EDIT | INPUT | OUTPUT | READ | SAVE | string | symbol | ''
  ```

- `Format`:
  Defines the data format:
  ```ts
  type Format = HTML | JSON | SQL | string | symbol | ''
  ```

- `FormatTransformer`:
  Function for transforming a property value:
  ```ts
  type FormatTransformer = (value: any, data: any) => any
  ```

- `Transformer`
  Transforms a property value based on its context:
  ```ts
  type Transformer<T extends object = object>(
  	value: any, target: ObjectOrType<T>, property: KeyOf<T>, data: any, format: Format, direction: Direction
  ) => any
  ```

- `Transformers`:
  Array of transformer definitions:
  ```ts
  type Transformers<T extends object = object> = { 
  	format?: Format, direction?: Direction, transformer: Transformer<T>
  }[]
  ```

### applyTransformer

```ts
async applyTransformer<T extends object>(
	value: any, target: ObjectOrType<T>, property: KeyOf<T>, format: Format, direction: Direction, data?: any
): Promise<any>
```
Applies a transformer to a property's value.

**Parameters:**
- `value`: The value to be transformed.
- `target`: The [object or type](https://github.com/itrocks-ts/class-type#objectortype) that contains the property.
- `property`: The [property name](https://github.com/itrocks-ts/class-type#keyof).
- `format`: The desired data `format`.
- `direction`: The transformation's purpose.
- `data` (optional): Additional context data to pass to the transformation function.

**Returns:**
The transformed value.

**Example:**
```ts
const result = await applyTransformer(value, object, 'property', HTML, EDIT, { context: 'example' })
```

### setFormatTransformer

```ts
setFormatTransformer(format: string, transformer: FormatTransformer)
```
Defines a global transformer to apply by default for a specific format.

**Parameters:**
- `format`: The data format (e.g., `JSON`).
- `transformer`: A function that globally transforms the result for the given format.

**Example:**
```ts
setFormatTransformer(JSON, (result, data) => JSON.stringify({ result, ...data }))
```

### setPropertyTransformer

```ts
function setPropertyTransformer<T extends object>(
	target: ObjectOrType<T>, property: KeyOf<T>, format: Format, direction: Direction, transformer: Transformer<T> | false
): Transformer<T> | false
```
Sets a [Transformer](#types) for a specific property, [Format](#constants) and [Direction](#constants).

**Parameters:**
- `target`: The [object or type](https://github.com/itrocks-ts/class-type#objectortype) that contains the property.
- `property`: The [property](https://github.com/itrocks-ts/class-type#keyof).
- `format`: The data [Format](#constants).
- `direction`: The transformation [Direction](#constants).
- `transformer`: The [Transformer](#types) function.

**Returns:**
The `transformer` argument value.

**Example:**
```ts
setPropertyTransformer(ClassName, 'property', HTML, EDIT, transformerFunction)
```

### setPropertyTransformers

```ts
setPropertyTransformers<T extends object>(
	target: ObjectOrType<T>, property: KeyOf<T>, transformers: Transformers<T>
)
```
Sets multiple transformers for a property.

**Parameters:**
- `target`: The [object or type](https://github.com/itrocks-ts/class-type#objectortype) containing the property.
- `property`: The [property](https://github.com/itrocks-ts/class-type#keyof).
- `transformers`: An array of [Transformer definitions](#types).

**Example:**
```ts
setPropertyTransformers(ClassName, 'property', [
	{ format: HTML, direction: EDIT,   transformer: editPropertyTransformerFunction },
	{ format: HTML, direction: OUTPUT, transformer: outputPropertyTransformerFunction }
])
```

### setPropertyTypeTransformer

```ts
setPropertyTypeTransformer<T extends object>(
	type: PropertyType, format: Format, direction: Direction, transformer: Transformer<T>
)
```
Sets a transformer for a specific type.

**Parameters:**
- `type`: The type of the property (e.g., `Boolean`).
- `format`: The data [Format](#constants).
- `direction`: The transformation [Direction](#constants).
- `transformer`: The [Transformer](#types) function.

**Example:**
```ts
setPropertyTypeTransformer(Boolean, HTML, OUTPUT, value => value ? 'yes' : 'no')
```

### setPropertyTypeTransformers

```ts
setPropertyTypeTransformers<T extends object>(type: PropertyType, transformers: Transformers<T>)
```
Sets multiple transformers for a specific property type.

**Parameters:**
- `type`: The [type](https://github.com/itrocks-ts/class-type#objectortype) of the property.
- `transformers`: An array of [Transformer definitions](#types).

**Example:**
```ts
setPropertyTypeTransformers(Number, [
	{ format: HTML, direction: EDIT,  transformer: value => `<input type="number" value="${value}">` },
	{ format: HTML, direction: INPUT, transformer: value => parseFloat(value) }
])
```

### @Transform

A decorator for applying transformers to class properties.

**Examples:**
```ts
class User
{
	@Transform(HTML, EDIT, (value) => `<input type="text" value="${value}">`)
	name: string

	@Transform([
		{ format: HTML, direction: EDIT,  transformer: () => `<input type="password">` },
		{ format: HTML, direction: INPUT, transformer: value => value.length ? 'hashed-value' : '' }
	])
	password: string
}
```
