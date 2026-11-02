# Tree

树与列表转换、节点及路径查找。支持多棵树、自定义字段名和只读输入，可在 Node.js、SSR 和浏览器中使用。

## 基本用法

```ts
import { findTreeNode, findTreePath, listToTree, treeToList } from '@xxkatt/utils'

const list = [
  { id: 1, parentId: null, name: '根节点' },
  { id: 2, parentId: 1, name: '子节点' },
  { id: 3, parentId: 2, name: '叶节点' },
  { id: 4, parentId: null, name: '另一个根节点' },
]

const tree = listToTree(list)
// [
//   {
//     id: 1, parentId: null, name: '根节点',
//     children: [{
//       id: 2, parentId: 1, name: '子节点',
//       children: [{ id: 3, parentId: 2, name: '叶节点', children: [] }],
//     }],
//   },
//   { id: 4, parentId: null, name: '另一个根节点', children: [] },
// ]

treeToList(tree) // 与上面的 list 内容相同，顺序为 1、2、3、4

findTreeNode(tree, (node) => node.id === 3)
// { id: 3, parentId: 2, name: '叶节点', children: [] }，返回树中的原节点

findTreePath(tree, (node) => node.id === 3)?.map((node) => node.id)
// [1, 2, 3]，路径包含根节点和目标节点自身

findTreeNode(tree, (node) => node.id === 99) // undefined
findTreePath(tree, (node) => node.id === 99) // undefined
```

## 自定义字段

```ts
const list = [
  { key: 'child', pid: 'root', title: '子节点' },
  { key: 'root', pid: null, title: '根节点' },
]

const tree = listToTree(list, {
  idKey: 'key',
  parentIdKey: 'pid',
  childrenKey: 'nodes',
})
// [{ key: 'root', pid: null, title: '根节点', nodes: [
//   { key: 'child', pid: 'root', title: '子节点', nodes: [] },
// ] }]

treeToList(tree, { childrenKey: 'nodes' })
// [
//   { key: 'root', pid: null, title: '根节点' },
//   { key: 'child', pid: 'root', title: '子节点' },
// ]

findTreeNode(tree, (node) => node.key === 'child', { childrenKey: 'nodes' })
findTreePath(tree, (node) => node.key === 'child', { childrenKey: 'nodes' })
```

字段名支持字符串，ID、父 ID 和子节点字段应使用不同名称。

## API

| 函数                                      | 返回值                       | 说明                                                 |
| ----------------------------------------- | ---------------------------- | ---------------------------------------------------- |
| `treeToList(tree, options?)`              | `Omit<T, ChildrenKey>[]`     | 深度优先前序展开，浅拷贝节点并移除子节点字段         |
| `listToTree(list, options?)`              | `TreeNode<T, ChildrenKey>[]` | 通过 ID 与父 ID 建树，每个节点都具有子节点数组       |
| `findTreeNode(tree, predicate, options?)` | `T \| undefined`             | 返回深度优先前序遍历中首个匹配的原节点               |
| `findTreePath(tree, predicate, options?)` | `T[] \| undefined`           | 返回首个匹配节点从根到自身的路径，数组内为原节点引用 |

`T` 是输入节点类型，`predicate` 的签名为 `(node: T) => boolean`。树输入为 `readonly T[]`，子节点字段应为同类节点数组、`null` 或 `undefined`；缺省子节点字段和空数组均视为叶节点。查找命中后立即停止遍历。

### 选项与类型

| 选项          | 默认值       | 适用函数     |
| ------------- | ------------ | ------------ |
| `idKey`       | `'id'`       | `listToTree` |
| `parentIdKey` | `'parentId'` | `listToTree` |
| `childrenKey` | `'children'` | 全部四个函数 |

以下类型均可从 `@xxkatt/utils` 导入，通常由输入数据和选项自动推断，无需手动指定泛型。

```ts
type TreeId = string | number

type TreeNode<T, ChildrenKey extends string = 'children'> = Omit<T, ChildrenKey> & {
  [Key in ChildrenKey]: TreeNode<T, ChildrenKey>[]
}

interface TreeOptions<ChildrenKey extends string = 'children'> {
  childrenKey?: ChildrenKey
}

interface ListToTreeOptions<
  IdKey extends string = 'id',
  ParentIdKey extends string = 'parentId',
  ChildrenKey extends string = 'children',
> extends TreeOptions<ChildrenKey> {
  idKey?: IdKey
  parentIdKey?: ParentIdKey
}
```

## 转换规则

- `listToTree` 要求每项都有字符串或数字 ID；父 ID 可缺省或为 `null`、`undefined`。ID 按 `Map` 的键规则比较，不进行类型转换，`1` 与 `'1'` 是不同 ID，`0` 和 `''` 都是有效 ID。
- 父 ID 为 `null`、`undefined`，或对应父节点不存在时，该项作为根节点。`0` 和 `''` 不作特殊根标记：存在对应节点时会挂到该父节点下，否则作为根节点。
- 输入列表可以任意排序，子节点可以在父节点之前。根节点与每组同级节点分别保持它们在输入列表中的相对顺序。
- 重复 ID、自引用和任何循环父子关系都会抛出 `Error`，包括没有连接到根节点的循环。
- `listToTree` 浅拷贝每个节点，用新数组覆盖已有子节点字段；叶节点的子节点字段为 `[]`，父 ID 字段保持原值。
- `treeToList` 按父节点在前、子节点在后的顺序展开，并按数组顺序访问同级节点。它移除子节点字段，保留其余自有可枚举字段，不会自动补充或修改 ID、父 ID。因此原树没有父 ID 时，扁平化结果也不会生成父子关系。
- 转换不会修改输入，业务字段中的嵌套对象仍共享引用。查找返回原节点引用，修改返回节点也会影响输入树。
- 树输入应为无循环的树结构，遍历过程中不要修改结构。转换和查找采用迭代遍历，支持深层树；列表建树和完整遍历的时间复杂度均为 O(n)。
