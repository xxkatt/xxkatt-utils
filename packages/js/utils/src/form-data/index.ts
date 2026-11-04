export type FormDataScalar = string | number | boolean | Blob

export type FormDataValue = FormDataScalar | readonly FormDataScalar[] | null | undefined

export type FormDataFields = Readonly<Record<string, FormDataValue>>

function appendValue(formData: FormData, name: string, value: FormDataScalar): void {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    formData.append(name, String(value))
  } else {
    formData.append(name, value)
  }
}

function isFormDataArray(value: FormDataValue): value is readonly FormDataScalar[] {
  return Array.isArray(value)
}

/** 将字段追加到 FormData；数组按顺序生成重复键，null、undefined 和空数组会跳过。 */
export function appendFormData(formData: FormData, fields: FormDataFields): FormData {
  for (const [name, value] of Object.entries(fields)) {
    if (value === null || value === undefined) continue

    if (isFormDataArray(value)) {
      for (const item of value) appendValue(formData, name, item)
    } else {
      appendValue(formData, name, value)
    }
  }

  return formData
}

/** 根据普通字段对象创建 FormData。 */
export function objectToFormData(fields: FormDataFields): FormData {
  return appendFormData(new FormData(), fields)
}
