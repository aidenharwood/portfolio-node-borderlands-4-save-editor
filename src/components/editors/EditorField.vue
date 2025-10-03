<template>
	<div class="rounded-xl border border-border/50 bg-card/60 shadow-sm transition hover:border-border/80">
		<div class="grid gap-4 p-4 sm:p-5"
			:class="inlineLayout ? 'sm:grid-cols-[minmax(200px,0.45fr)_1fr] sm:items-center sm:gap-6' : 'sm:grid-cols-[minmax(200px,0.45fr)_1fr] sm:items-start'">
			<div class="flex flex-col">
				<div class="flex items-center gap-2 text-sm font-semibold text-foreground">
					<span class="truncate">{{ props.semanticName }}</span>
					<button v-if="props.description" type="button" :title="props.description"
						class="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border/40 text-xs text-muted-foreground transition hover:border-border hover:text-foreground">
						<i class="pi pi-info-circle"></i>
						<span class="sr-only">Field help</span>
					</button>
				</div>
			</div>

			<div :class="inputContainerClass">
				<!-- Serial copy button -->
				<div v-if="props.inputType === 'string' && isSerialField" class="flex items-center gap-2">
					<button type="button" @click="copyToClipboard(localValue)"
						:class="[BUTTON_BASE, 'ml-2', 'rounded-md', 'px-3', 'font-mono']" :title="'Copy serial'">
						<i class="pi pi-copy"></i>
						<span class="truncate max-w-[24ch] ml-2">{{ localValue }}</span>
					</button>
					<!-- Serial editor quick action (open unified SerialEditor focused on serial) -->
					<button type="button" @click.stop="() => emit('openItemEditor', props.yamlPath)"
						class="ml-2 inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs">
						<i class="pi pi-code"></i>
						<span>Edit serial</span>
					</button>
				</div>

				<input v-else-if="props.inputType === 'number'" type="number" :class="inputBaseClass"
					:placeholder="props.placeholder" :step="props.numberStep ?? 1" :min="props.numberMin"
					:max="props.numberMax" :value="localValue ?? ''" @input="handleNumberInput" />

				<label v-else-if="props.inputType === 'boolean'"
					class="inline-flex items-center gap-3 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm font-medium text-foreground shadow-sm">
					<input type="checkbox"
						class="h-4 w-4 rounded border-border/60 text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
						:checked="Boolean(localValue)" @change="handleBooleanChange" />
					<span>{{ props.booleanLabel || 'Enabled' }}</span>
				</label>

				<select v-else-if="props.inputType === 'dropdown'" :class="inputBaseClass"
					:value="serializeOptionValue(localValue)" @change="handleDropdownChange">
					<option value="" disabled v-if="!props.dropdownOptions?.length">No options configured</option>
					<option v-for="option in props.dropdownOptions ?? []" :key="serializeOptionValue(option.value)"
						:value="serializeOptionValue(option.value)">
						{{ option.label }}
					</option>
				</select>

				<div v-else-if="props.inputType === 'multiselect'" class="space-y-3">
					<div v-if="props.multiselectOptions?.length" class="flex flex-wrap gap-2">
						<label v-for="option in props.multiselectOptions" :key="serializeOptionValue(option.value)"
							class="flex items-center gap-2 rounded-lg border border-border/50 bg-background/70 px-3 py-2 text-sm text-foreground shadow-sm">
							<input type="checkbox"
								class="h-4 w-4 rounded border-border/60 text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
								:checked="isMultiselectOptionSelected(option.value)"
								@change="(event) => handleMultiselectOptionChange(option.value, event)" />
							<span>{{ option.label }}</span>
						</label>
					</div>
					<p v-else
						class="rounded-lg border border-border/40 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
						No multiselect options configured.
					</p>
					<div v-if="Array.isArray(localValue) && localValue.length" class="flex flex-wrap gap-2">
						<span v-for="value in localValue" :key="serializeOptionValue(value)"
							class="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/80 px-2 py-1 text-xs font-medium text-foreground">
							{{ getMultiselectLabel(value) }}
						</span>
					</div>
				</div>

				<div v-else-if="props.inputType === 'array'" class="space-y-3">
					<div v-if="arrayValue.length" class="space-y-3">
						<div v-for="(item, index) in arrayValue" :key="index"
							class="flex flex-col gap-3 rounded-lg border border-border/50 bg-background/70 p-3 shadow-sm sm:flex-row sm:items-center sm:gap-4">
							<div class="flex-1">
								<template v-if="props.arrayItemType === 'number'">
									<input type="number" :class="inputBaseClass" :value="item ?? ''"
										:step="props.numberStep ?? 1"
										@input="(event) => handleArrayItemChange(index, event)" />
								</template>
								<template v-else-if="props.arrayItemType === 'boolean'">
									<label class="inline-flex items-center gap-3">
										<input type="checkbox"
											class="h-4 w-4 rounded border-border/60 text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
											:checked="Boolean(item)"
											@change="(event) => handleArrayItemChange(index, event)" />
										<span class="text-sm text-foreground">Enabled</span>
									</label>
								</template>
								<template v-else-if="props.arrayItemType === 'dropdown'">
									<select :class="inputBaseClass" :value="serializeOptionValue(item)"
										@change="(event) => handleArrayItemChange(index, event)">
										<option v-for="option in props.arrayItemOptions ?? []"
											:key="serializeOptionValue(option.value)"
											:value="serializeOptionValue(option.value)">
											{{ option.label }}
										</option>
									</select>
								</template>
								<template v-else>
									<input type="text" :class="inputBaseClass" :value="item ?? ''"
										@input="(event) => handleArrayItemChange(index, event)" />
								</template>
							</div>

							<button type="button" @click="handleArrayRemove(index)"
								:class="[BUTTON_BASE, 'w-full', 'font-semibold', 'uppercase', 'tracking-wide', 'text-destructive', 'border-destructive/50', 'bg-destructive/10', 'sm:w-auto']">
								<i class="pi pi-times text-xs"></i>
								<span>Remove</span>
							</button>
						</div>
					</div>

					<button type="button" @click="handleArrayAdd"
						:class="[BUTTON_BASE, 'font-semibold', 'uppercase', 'tracking-wide']">
						<i class="pi pi-plus text-xs"></i>
						Add item
					</button>
				</div>

				<div v-else-if="props.inputType === 'nested'" class="space-y-3">
					<div
						class="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 px-3 py-2">
						<div class="flex items-center gap-2 text-sm font-semibold text-foreground">
							<i class="pi pi-folder"></i>
							<span>Nested fields</span>
						</div>
						<button v-if="props.nestedCollapsible !== false" type="button" @click="toggleNested"
							:class="[BUTTON_BASE, 'rounded-md', 'px-2', 'text-muted-foreground']">
							<i class="pi" :class="isNestedExpanded ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
						</button>
					</div>

					<div v-if="isNestedExpanded" class="space-y-4">
						<EditorField v-for="nestedField in props.nestedConfig ?? []" :key="nestedField.yamlPath"
							v-bind="nestedField" :yamlPath="nestedField.yamlPath"
							:value="getNestedValue(nestedField.yamlPath)"
							@update="(value) => handleNestedUpdate(nestedField.yamlPath, value)" />
					</div>
				</div>

				<div v-else-if="props.inputType === 'objectArray'" class="space-y-4">
					<div v-if="objectArrayValue.length" class="space-y-4">
						<div v-for="(item, index) in objectArrayValue" :key="index"
							class="rounded-lg border border-border/60 bg-background/70 p-4 shadow-sm">
							<div class="flex flex-wrap items-center justify-between gap-3">
								<div class="flex flex-col">
									<span class="text-sm font-semibold text-foreground">
										{{ getObjectArrayItemDisplayValue(item) }}
										<span
											class="ml-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">#{{
												index +
												1 }}</span>
									</span>
								</div>
								<button type="button" @click="removeObjectArrayItem(index)"
									:class="[BUTTON_BASE, 'font-semibold', 'uppercase', 'tracking-wide', 'text-destructive', 'border-destructive/50', 'bg-destructive/10']">
									<i class="pi pi-trash text-xs"></i>
									Remove
								</button>
							</div>

							<div class="mt-4 space-y-4">
								<EditorField v-for="fieldConfig in props.objectArrayItemConfig ?? []"
									:key="fieldConfig.yamlPath" v-bind="fieldConfig" :yamlPath="fieldConfig.yamlPath"
									:value="getObjectArrayItemValue(item, fieldConfig.yamlPath)"
									@update="(value) => updateObjectArrayItemField(index, fieldConfig.yamlPath, value)" />
							</div>
						</div>
					</div>

					<button type="button" @click="addObjectArrayItem" :disabled="reachedObjectArrayLimit"
						:class="[BUTTON_BASE, 'font-semibold', 'uppercase', 'tracking-wide', 'disabled:opacity-60']">
						<i class="pi pi-plus text-xs"></i>
						{{ props.objectArrayAddButtonText ?? 'Add item' }}
						<span v-if="reachedObjectArrayLimit" class="text-xs text-muted-foreground">(max {{
							props.objectArrayMaxItems
							}})</span>
					</button>
				</div>

				<button v-else-if="props.inputType === 'button'" type="button" @click="handleButtonClick"
					:class="[BUTTON_BASE, 'px-4', 'font-semibold', 'uppercase', 'tracking-wide', 'bg-primary/15', 'text-accent-foreground']">
					<i class="pi pi-bolt text-xs"></i>
					{{ props.semanticName }}
				</button>

				<input v-else type="text" :class="inputBaseClass" :placeholder="props.placeholder"
					:value="localValue ?? ''" @input="handleTextInput" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
/* eslint-disable @typescript-eslint/no-unused-vars */
import { copyToClipboard } from '../../lib/utils/clipboard'
import type { EditorFieldConfig } from '../../lib/types/editor-interfaces'
import { getItemDisplayName, decodeItemSerial } from '../../lib/utils/serial-utils'

defineOptions({ name: 'EditorField' })

interface Props extends EditorFieldConfig {
	value: any
}

interface Emits {
	(e: 'update', value: any): void
	(e: 'openItemEditor', yamlPath: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const clone = <T>(value: T): T => {
	if (value === null || value === undefined) {
		return value
	}
	try {
		return structuredClone(value)
	} catch {
		return JSON.parse(JSON.stringify(value))
	}
}

const localValue = ref<any>(clone(props.value))
const arrayValue = ref<any[]>(Array.isArray(localValue.value) ? clone(localValue.value) : [])
const objectArrayValue = ref<any[]>(Array.isArray(localValue.value) ? clone(localValue.value) : [])
const isNestedExpanded = ref(true)

const inputBaseClass =
	'w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-muted-foreground/70'

// Standard button base to keep buttons uniform height and alignment
const BUTTON_BASE = 'inline-flex items-center justify-center h-10 gap-2 rounded-lg border px-3 text-xs'

const isComplexInput = computed(() => ['multiselect', 'array', 'nested', 'objectArray'].includes(props.inputType))
const inlineLayout = computed(() => !isComplexInput.value)
const inputContainerClass = computed(() => {
	if (inlineLayout.value) {
		return 'space-y-4 sm:space-y-0 sm:col-span-1 sm:border-l sm:border-border/60 sm:pl-6 sm:py-0 sm:flex sm:items-center sm:gap-4'
	}
	return 'space-y-4 sm:col-span-2'
})

const reachedObjectArrayLimit = computed(() => {
	if (!props.objectArrayMaxItems) return false
	return objectArrayValue.value.length >= props.objectArrayMaxItems
})

const isSerialField = computed(() => {
	if (!props.yamlPath) return false
	const lowerName = (props.semanticName || '').toString().toLowerCase()
	return String(props.yamlPath).endsWith('.serial') || lowerName.includes('serial')
})

watch(
	() => props.value,
	(nextValue) => {
		const cloned = clone(nextValue)
		localValue.value = cloned

		if (props.inputType === 'array') {
			arrayValue.value = Array.isArray(cloned) ? clone(cloned) : []
		}

		if (props.inputType === 'objectArray') {
			objectArrayValue.value = Array.isArray(cloned) ? clone(cloned) : []
		}
	},
	{ deep: true }
)

const serializeOptionValue = (value: any): string => {
	if (value === null || value === undefined) return ''
	if (typeof value === 'object') return JSON.stringify(value)
	return String(value)
}

const deserializeOptionValue = (raw: string, options?: Array<{ value: any }>) => {
	if (!options || !options.length) {
		return raw
	}

	for (const option of options) {
		if (typeof option.value === 'object') {
			if (JSON.stringify(option.value) === raw) {
				return clone(option.value)
			}
		} else if (String(option.value) === raw) {
			return option.value
		}
	}

	return raw
}

const emitAndSetLocal = (value: any) => {
	localValue.value = value
	emit('update', value)
}

const handleTextInput = (event: Event) => {
	const value = (event.target as HTMLInputElement).value
	emitAndSetLocal(value)
}

const handleNumberInput = (event: Event) => {
	const input = event.target as HTMLInputElement
	const value = input.value === '' ? null : Number(input.value)
	emitAndSetLocal(value)
}

const handleBooleanChange = (event: Event) => {
	const checked = (event.target as HTMLInputElement).checked
	emitAndSetLocal(checked)
}

const handleDropdownChange = (event: Event) => {
	const target = event.target as HTMLSelectElement
	const value = deserializeOptionValue(target.value, props.dropdownOptions)
	emitAndSetLocal(value)
}

const handleMultiselectOptionChange = (optionValue: any, event: Event) => {
	const checked = (event.target as HTMLInputElement).checked
	const current = Array.isArray(localValue.value) ? [...localValue.value] : []

	if (checked) {
		if (!current.some((value) => serializeOptionValue(value) === serializeOptionValue(optionValue))) {
			current.push(clone(optionValue))
		}
	} else {
		const index = current.findIndex((value) => serializeOptionValue(value) === serializeOptionValue(optionValue))
		if (index !== -1) {
			current.splice(index, 1)
		}
	}

	emitAndSetLocal(current)
}

const handleArrayItemChange = (index: number, event: Event) => {
	const target = event.target as HTMLInputElement | HTMLSelectElement
	let value: any

	switch (props.arrayItemType) {
		case 'number':
			value = target instanceof HTMLInputElement && target.value === '' ? null : Number(target.value)
			break
		case 'boolean':
			value = (target as HTMLInputElement).checked
			break
		case 'dropdown':
			value = deserializeOptionValue(target.value, props.arrayItemOptions)
			break
		default:
			value = target instanceof HTMLInputElement ? target.value : target.value
	}

	arrayValue.value.splice(index, 1, value)
	const updated = [...arrayValue.value]
	emitAndSetLocal(updated)
}

const handleArrayRemove = (index: number) => {
	arrayValue.value.splice(index, 1)
	const updated = [...arrayValue.value]
	emitAndSetLocal(updated)
}

const handleArrayAdd = () => {
	let defaultValue: any = ''

	switch (props.arrayItemType) {
		case 'number':
			defaultValue = 0
			break
		case 'boolean':
			defaultValue = false
			break
		case 'dropdown':
			defaultValue = props.arrayItemOptions?.[0]?.value ?? ''
			break
		default:
			defaultValue = ''
	}

	arrayValue.value.push(clone(defaultValue))
	const updated = [...arrayValue.value]
	emitAndSetLocal(updated)
}

const toggleNested = () => {
	if (props.nestedCollapsible !== false) {
		isNestedExpanded.value = !isNestedExpanded.value
	}
}

const getNestedValue = (nestedPath: string) => {
	if (!localValue.value || typeof localValue.value !== 'object') {
		return undefined
	}

	const pathParts = nestedPath.split('.')
	let current: any = localValue.value

	for (const part of pathParts) {
		if (current && typeof current === 'object' && part in current) {
			current = current[part]
		} else {
			return undefined
		}
	}

	return current
}

const handleNestedUpdate = (nestedPath: string, value: any) => {
	if (!localValue.value || typeof localValue.value !== 'object') {
		localValue.value = {}
	}

	const pathParts = nestedPath.split('.')
	let current: any = localValue.value

	for (let i = 0; i < pathParts.length - 1; i++) {
		const part = pathParts[i]
		if (!(part in current) || typeof current[part] !== 'object') {
			current[part] = {}
		}
		current = current[part]
	}

	current[pathParts[pathParts.length - 1]] = value
	const cloned = clone(localValue.value)
	emitAndSetLocal(cloned)
}

const getObjectArrayItemDisplayValue = (item: any) => {
	if (!props.objectArrayDisplayField) return 'Item'

	const pathParts = props.objectArrayDisplayField.split('.')
	let current = item

	for (const part of pathParts) {
		if (current && typeof current === 'object' && part in current) {
			current = current[part]
		} else {
			return 'Item'
		}
	}

	// If the display field contains a serial, try to decode and build a concise summary
	if (typeof current === 'string' && current.startsWith('@U')) {
		try {
			const decoded = decodeItemSerial(current)
			const typeLabel = decoded?.itemCategory ? String(decoded.itemCategory).replace(/_/g, ' ') : (decoded?.itemType || '')
			const lvl = decoded?.stats?.level
			const rar = decoded?.stats?.rarity
			const p = decoded?.stats?.primaryStat
			const s = decoded?.stats?.secondaryStat
			const parts: string[] = []
		if (typeLabel) parts.push(typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1))
		if (lvl || lvl === 0) parts.push(`Lv${lvl}`)
		if (rar || rar === 0) parts.push(`R${rar}`)
		if (p !== undefined) parts.push(`P:${p}`)
		if (s !== undefined) parts.push(`S:${s}`)
		const summary = parts.length > 0 ? parts.join(' • ') : getItemDisplayName(current)
		return summary
		} catch (error) {
			console.warn(`Failed to decode serial for display:`, error)
		}
	}

	return current || 'Item'
}

const updateObjectArrayItemField = (itemIndex: number, fieldPath: string, value: any) => {
	const items = clone(objectArrayValue.value)

	if (!items[itemIndex]) {
		items[itemIndex] = {}
	}

	const pathParts = fieldPath.split('.')
	let current = items[itemIndex]

	for (let i = 0; i < pathParts.length - 1; i++) {
		const part = pathParts[i]
		if (!(part in current) || typeof current[part] !== 'object') {
			current[part] = {}
		}
		current = current[part]
	}

	current[pathParts[pathParts.length - 1]] = value

	objectArrayValue.value = items
	emitAndSetLocal(clone(items))
}

const removeObjectArrayItem = (index: number) => {
	const items = clone(objectArrayValue.value)
	items.splice(index, 1)
	objectArrayValue.value = items
	emitAndSetLocal(clone(items))
}

const addObjectArrayItem = () => {
	if (reachedObjectArrayLimit.value) return

	const items = clone(objectArrayValue.value)
	const newItem: Record<string, any> = {}

	if (props.objectArrayItemConfig) {
		props.objectArrayItemConfig.forEach((fieldConfig) => {
			const defaultValue = fieldConfig.inputType === 'number' ? 0 : fieldConfig.inputType === 'boolean' ? false : ''
			const pathParts = fieldConfig.yamlPath.split('.')
			let current = newItem

			for (let i = 0; i < pathParts.length - 1; i++) {
				const part = pathParts[i]
				if (!(part in current)) {
					current[part] = {}
				}
				current = current[part]
			}

			current[pathParts[pathParts.length - 1]] = defaultValue
		})
	}

	items.push(newItem)
	objectArrayValue.value = items
	emitAndSetLocal(clone(items))
}

const getObjectArrayItemValue = (item: any, fieldPath: string) => {
	const pathParts = fieldPath.split('.')
	let current = item

	for (const part of pathParts) {
		if (current && typeof current === 'object' && part in current) {
			current = current[part]
		} else {
			return undefined
		}
	}

	return current
}

const isMultiselectOptionSelected = (optionValue: any) => {
	return Array.isArray(localValue.value) && localValue.value.some((value) => serializeOptionValue(value) === serializeOptionValue(optionValue))
}

const getMultiselectLabel = (value: any) => {
	if (props.multiselectValueMap && value in props.multiselectValueMap) {
		return props.multiselectValueMap[value]
	}

	const option = props.multiselectOptions?.find((opt) => serializeOptionValue(opt.value) === serializeOptionValue(value))
	return option?.label || String(value)
}

const handleButtonClick = () => {
	emit('update', true)
}

// Template-only usage can confuse the TypeScript checker.
// No template-only references needed here.
</script>
