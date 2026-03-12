import { DecorateCaller }          from '@itrocks/decorator/property'
import { parameterProperty }       from '@itrocks/decorator/property'
import { Direction }               from './transformer'
import { Format }                  from './transformer'
import { Transformer  }            from './transformer'
import { Transformers }            from './transformer'
import { setPropertyTransformer }  from './transformer'
import { setPropertyTransformers } from './transformer'

export function Transform<T extends object>(transformers: Transformers): DecorateCaller<T>
export function Transform<T extends object>(format: Format, transformer: Transformer<T> | false): DecorateCaller<T>
export function Transform<T extends object>(format: Format, direction: Direction, transformer: Transformer<T> | false)
	: DecorateCaller<T>
export function Transform<T extends object>(
	format: Format | Transformers<T>, direction?: Direction | Transformer<T> | false, transformer?: Transformer<T> | false
): DecorateCaller<T> | void
{
	if ((typeof format !== 'string') && (typeof format !== 'symbol')) {
		return (target, property, index) => {
			const [targetObject, parameterName] = parameterProperty(target, property, index)
			return setPropertyTransformers(targetObject, parameterName, format)
		}
	}
	if ((typeof direction === 'function') || (direction === false)) {
		return (target, property, index) => {
			const [targetObject, parameterName] = parameterProperty(target, property, index)
			setPropertyTransformer(targetObject, parameterName, format, '', direction)
		}
	}
	if (transformer === undefined) return
	return (target, property, index) => {
		const [targetObject, parameterName] = parameterProperty(target, property, index)
		setPropertyTransformer(targetObject, parameterName, format, direction ?? '', transformer)
	}
}
