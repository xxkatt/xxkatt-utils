# FormData

把普通字段对象转换为 `FormData`，适合提交同时包含文本字段和文件的表单。字符串、数字、布尔值会转换为字符串，`File`/`Blob` 会作为文件值保留。

## 基本用法

```ts
import { objectToFormData } from '@xxkatt/utils'

const formObject = {
  username: '小明',
  age: 18,
  sex: '男',
  hobby: '编码',
  job: '前端工程师',
  profilePicture: file,
}

const formData = objectToFormData(formObject)

await fetch('/api/profile', {
  method: 'POST',
  body: formData,
})
```

## 追加到已有实例

`appendFormData` 会在已有 `FormData` 上继续追加字段，并返回同一个实例。适合分步构造请求数据：

```ts
import { appendFormData } from '@xxkatt/utils'

const formData = new FormData()
formData.append('csrfToken', token)
appendFormData(formData, { username: '小明', age: 18 })
```

## 类型签名

```ts
type FormDataScalar = string | number | boolean | Blob
type FormDataValue = FormDataScalar | readonly FormDataScalar[] | null | undefined
type FormDataFields = Readonly<Record<string, FormDataValue>>

function objectToFormData(fields: FormDataFields): FormData
function appendFormData(formData: FormData, fields: FormDataFields): FormData
```

## 字段规则

| 输入值                      | 处理方式                                           |
| --------------------------- | -------------------------------------------------- |
| 字符串、数字、布尔值        | 转为字符串后追加                                   |
| `File`、`Blob`              | 作为文件值追加；`File` 的文件名由原对象保留        |
| 数组                        | 按顺序使用同一个字段名重复追加，例如 `tag=a&tag=b` |
| 空字符串、`0`、`false`      | 保留并追加                                         |
| `null`、`undefined`、空数组 | 跳过                                               |

函数只读取对象自身的可枚举字符串属性，不会修改传入对象。嵌套对象需要先自行转换为 JSON 字符串；如果需要为 `Blob` 指定文件名，可直接调用原生 `formData.append(name, blob, filename)`。
