import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { filterTree, findTreeNode, findTreePath, listToTree, mapTree, treeToList } from '@/index'
import type { TreeNode } from '@/index'

interface Item {
  id: number
  parentId?: number | null
  name: string
  children?: readonly Item[] | null
}

const leaf: Item = Object.freeze({ id: 3, parentId: 2, name: 'leaf' })
const child: Item = Object.freeze({
  id: 2,
  parentId: 1,
  name: 'child',
  children: Object.freeze([leaf]),
})
const root: Item = Object.freeze({
  id: 1,
  parentId: null,
  name: 'root',
  children: Object.freeze([child, { id: 4, parentId: 1, name: 'sibling', children: null }]),
})
const tree: readonly Item[] = Object.freeze([
  root,
  Object.freeze({ id: 5, name: 'other', children: [] }),
])

describe('treeToList', () => {
  it('按深度优先前序展开多棵树，移除 children 并保留业务字段', () => {
    const result = treeToList(tree)

    expect(result).toEqual([
      { id: 1, parentId: null, name: 'root' },
      { id: 2, parentId: 1, name: 'child' },
      { id: 3, parentId: 2, name: 'leaf' },
      { id: 4, parentId: 1, name: 'sibling' },
      { id: 5, name: 'other' },
    ])
    expect(result[0]).not.toBe(root)
    expect(root.children).toEqual([child, { id: 4, parentId: 1, name: 'sibling', children: null }])
    expectTypeOf(result).toEqualTypeOf<Omit<Item, 'children'>[]>()
  })

  it('支持自定义 children 字段，其他同名业务字段保持原样', () => {
    const data = [{ key: 'root', children: 'metadata', nodes: [{ key: 'child' }] }]

    expect(treeToList(data, { childrenKey: 'nodes' })).toEqual([
      { key: 'root', children: 'metadata' },
      { key: 'child' },
    ])
    expect(treeToList([])).toEqual([])
  })
})

describe('listToTree', () => {
  it('允许子节点在父节点之前，保持根节点及同级节点的输入顺序', () => {
    const list = Object.freeze([
      leaf,
      Object.freeze({ id: 5, parentId: 99, name: 'orphan' }),
      Object.freeze({ id: 4, parentId: 1, name: 'sibling' }),
      child,
      root,
      Object.freeze({ id: 6, name: 'other' }),
    ])
    const result = listToTree(list)

    expect(result).toEqual([
      { id: 5, parentId: 99, name: 'orphan', children: [] },
      {
        id: 1,
        parentId: null,
        name: 'root',
        children: [
          { id: 4, parentId: 1, name: 'sibling', children: [] },
          {
            id: 2,
            parentId: 1,
            name: 'child',
            children: [{ id: 3, parentId: 2, name: 'leaf', children: [] }],
          },
        ],
      },
      { id: 6, name: 'other', children: [] },
    ])
    expect(result[1]).not.toBe(root)
    expect(root.children?.[0]).toBe(child)
    expect(treeToList(result)).toHaveLength(list.length)
    expect(listToTree([])).toEqual([])
  })

  it('支持自定义字段名，输出递归节点类型，替换已有的子节点字段', () => {
    const list = [
      { key: 'child', pid: 'root', nodes: 'old' },
      { key: 'root', pid: null, nodes: 'old' },
    ]
    const result = listToTree(list, {
      idKey: 'key',
      parentIdKey: 'pid',
      childrenKey: 'nodes',
    })

    expect(result).toEqual([
      {
        key: 'root',
        pid: null,
        nodes: [{ key: 'child', pid: 'root', nodes: [] }],
      },
    ])
    expect(list[0]?.nodes).toBe('old')
    expectTypeOf(result).toEqualTypeOf<TreeNode<(typeof list)[number], 'nodes'>[]>()
    expectTypeOf(listToTree([leaf])).toEqualTypeOf<TreeNode<Item>[]>()
  })

  it('区分字符串和数字 ID，支持 0、空字符串及原型相关 ID', () => {
    const list = [
      { id: 0, parentId: null },
      { id: '', parentId: 0 },
      { id: '0', parentId: '' },
      { id: '__proto__', parentId: '0' },
      { id: 'constructor', parentId: '__proto__' },
    ]

    expect(treeToList(listToTree(list))).toEqual(list)
    expect(listToTree(list)).toHaveLength(1)
  })

  it('拒绝重复 ID，允许数字与字符串形式的不同 ID', () => {
    expect(() => listToTree([{ id: 1 }, { id: 1 }])).toThrow(/duplicate/i)
    expect(listToTree([{ id: 1 }, { id: '1' }])).toHaveLength(2)
  })

  it.each([
    [{ id: 1, parentId: 1 }],
    [
      { id: 1, parentId: 2 },
      { id: 2, parentId: 1 },
    ],
    [
      { id: 3, parentId: 1 },
      { id: 1, parentId: 2 },
      { id: 2, parentId: 1 },
    ],
    [{ id: 0 }, { id: 1, parentId: 2 }, { id: 2, parentId: 3 }, { id: 3, parentId: 1 }],
  ])('拒绝自引用和循环父子关系：%j', (...list) => {
    expect(() => listToTree(list)).toThrow(/cycle/i)
  })
})

describe('findTreeNode / findTreePath', () => {
  it('按深度优先顺序返回首个匹配节点及包含自身的路径，保留原引用', () => {
    expect(findTreeNode(tree, (node) => node.id === 3)).toBe(leaf)
    const path = findTreePath(tree, (node) => node.id === 3)
    expect(path).toEqual([root, child, leaf])
    expect(path?.[0]).toBe(root)
    expect(path?.[1]).toBe(child)
    expect(path?.[2]).toBe(leaf)
    expect(findTreePath(tree, (node) => node.id === 1)).toEqual([root])
    expect(findTreePath(tree, (node) => node.id === 4)).toEqual([root, root.children?.[1]])
    expect(findTreePath(tree, (node) => node.id === 5)).toEqual([tree[1]])
    expect(findTreeNode(tree, (node) => node.name === 'child' || node.id === 5)).toBe(child)
    expectTypeOf(findTreeNode(tree, () => true)).toEqualTypeOf<Item | undefined>()
    expectTypeOf(path).toEqualTypeOf<Item[] | undefined>()
  })

  it('找到后立即停止遍历，重复匹配时优先返回先访问的节点', () => {
    const predicate = vi.fn((node: Item) => node.id === 2 || node.id === 5)
    expect(findTreeNode(tree, predicate)).toBe(child)
    expect(predicate.mock.calls.map(([node]) => node.id)).toEqual([1, 2])
    predicate.mockClear()
    expect(findTreePath(tree, predicate)).toEqual([root, child])
    expect(predicate.mock.calls.map(([node]) => node.id)).toEqual([1, 2])
  })

  it('支持自定义子节点字段，空树和未匹配时返回 undefined', () => {
    const data = [{ key: 1, nodes: [{ key: 2 }] }, { key: 3 }]
    expect(findTreeNode(data, (node) => node.key === 2, { childrenKey: 'nodes' })).toBe(
      data[0]?.nodes?.[0],
    )
    expect(findTreePath(data, (node) => node.key === 3, { childrenKey: 'nodes' })).toEqual([
      data[1],
    ])
    expect(findTreeNode(tree, () => false)).toBeUndefined()
    expect(findTreePath(tree, () => false)).toBeUndefined()
    expect(findTreeNode([], () => true)).toBeUndefined()
    expect(findTreePath([], () => true)).toBeUndefined()
  })
})

describe('filterTree', () => {
  it('保留命中节点及其祖先，移除其他分支并保持根节点和同级顺序', () => {
    const result = filterTree(tree, (node) => node.id >= 3)

    expect(result).toEqual([
      {
        id: 1,
        parentId: null,
        name: 'root',
        children: [
          {
            id: 2,
            parentId: 1,
            name: 'child',
            children: [{ id: 3, parentId: 2, name: 'leaf', children: [] }],
          },
          { id: 4, parentId: 1, name: 'sibling', children: [] },
        ],
      },
      { id: 5, name: 'other', children: [] },
    ])
    expect(filterTree(tree, (node) => node.id === 3)).toEqual([
      {
        id: 1,
        parentId: null,
        name: 'root',
        children: [
          {
            id: 2,
            parentId: 1,
            name: 'child',
            children: [{ id: 3, parentId: 2, name: 'leaf', children: [] }],
          },
        ],
      },
    ])
    expectTypeOf(result).toEqualTypeOf<TreeNode<Item>[]>()
  })

  it('按深度优先前序判断每个原节点，父节点命中不会自动保留后代', () => {
    const predicate = vi.fn((node: Item) => node.id === 1)

    expect(filterTree(tree, predicate)).toEqual([
      { id: 1, parentId: null, name: 'root', children: [] },
    ])
    expect(predicate.mock.calls.map(([node]) => node.id)).toEqual([1, 2, 3, 4, 5])
    expect(predicate.mock.calls[0]?.[0]).toBe(root)
    expect(predicate.mock.calls[2]?.[0]).toBe(leaf)
  })

  it('浅拷贝保留节点并创建新的子节点数组，不修改只读输入', () => {
    const metadata = Object.freeze({ label: 'shared' })
    const data = Object.freeze([
      Object.freeze({
        id: 1,
        metadata,
        children: Object.freeze([Object.freeze({ id: 2, metadata })]),
      }),
    ])
    const result = filterTree(data, () => true)

    expect(result[0]).not.toBe(data[0])
    expect(result[0]?.children).not.toBe(data[0]?.children)
    expect(result[0]?.children[0]).not.toBe(data[0]?.children[0])
    expect(result[0]?.metadata).toBe(metadata)
    expect(result[0]?.children[0]?.metadata).toBe(metadata)
    expect(result[0]?.children[0]?.children).toEqual([])
    expect(data[0]?.children[0]).not.toHaveProperty('children')
  })

  it('支持自定义子节点字段，保留其他同名业务字段并补齐叶节点数组', () => {
    const data = [
      { key: 1, children: 'metadata', nodes: [{ key: 2 }] },
      { key: 3, nodes: null },
    ]
    const result = filterTree(data, (node) => node.key !== 1, { childrenKey: 'nodes' })

    expect(result).toEqual([
      { key: 1, children: 'metadata', nodes: [{ key: 2, nodes: [] }] },
      { key: 3, nodes: [] },
    ])
    expectTypeOf(result).toEqualTypeOf<TreeNode<(typeof data)[number], 'nodes'>[]>()
  })

  it('空树或完全未匹配时返回空数组', () => {
    const predicate = vi.fn((node: Item) => node.id === 99)

    expect(filterTree([], predicate)).toEqual([])
    expect(predicate).not.toHaveBeenCalled()
    expect(filterTree(tree, predicate)).toEqual([])
    expect(predicate).toHaveBeenCalledTimes(5)
  })

  it('透传筛选函数的错误并停止遍历', () => {
    const error = new Error('filtering failed')
    const predicate = vi.fn((node: Item) => {
      if (node.id === 2) throw error
      return true
    })

    expect(() => filterTree(tree, predicate)).toThrow(error)
    expect(predicate.mock.calls.map(([node]) => node.id)).toEqual([1, 2])
  })
})

describe('mapTree', () => {
  it('按深度优先前序映射每个原节点，保留层级和同级顺序', () => {
    const mapper = vi.fn((node: Item) => ({ value: node.id, label: node.name }))
    const result = mapTree(tree, mapper)

    expect(result).toEqual([
      {
        value: 1,
        label: 'root',
        children: [
          {
            value: 2,
            label: 'child',
            children: [{ value: 3, label: 'leaf', children: [] }],
          },
          { value: 4, label: 'sibling', children: [] },
        ],
      },
      { value: 5, label: 'other', children: [] },
    ])
    expect(mapper.mock.calls.map(([node]) => node.id)).toEqual([1, 2, 3, 4, 5])
    expect(mapper.mock.calls[0]?.[0]).toBe(root)
    expect(mapper.mock.calls[2]?.[0]).toBe(leaf)
    expectTypeOf(result).toEqualTypeOf<TreeNode<{ value: number; label: string }>[]>()
  })

  it('浅拷贝映射结果并创建新的子节点数组，不修改只读输入', () => {
    const metadata = Object.freeze({ label: 'shared' })
    const data = Object.freeze([
      Object.freeze({
        id: 1,
        metadata,
        children: Object.freeze([Object.freeze({ id: 2, metadata })]),
      }),
    ])
    const result = mapTree(data, (node) => node)

    expect(result[0]).not.toBe(data[0])
    expect(result[0]?.children).not.toBe(data[0]?.children)
    expect(result[0]?.children[0]).not.toBe(data[0]?.children[0])
    expect(result[0]?.metadata).toBe(metadata)
    expect(result[0]?.children[0]?.metadata).toBe(metadata)
    expect(data[0]?.children[0]).not.toHaveProperty('children')
    expectTypeOf(result).toEqualTypeOf<TreeNode<(typeof data)[number]>[]>()
  })

  it('支持自定义子节点字段，覆盖映射结果中的该字段并保留其他业务字段', () => {
    const data = [
      { key: 1, nodes: [{ key: 2 }] },
      { key: 3, nodes: null },
    ]
    const mapped = Object.freeze({ label: 'mapped', children: 'metadata', nodes: 'old' })
    const result = mapTree(data, () => mapped, { childrenKey: 'nodes' })

    expect(result).toEqual([
      {
        label: 'mapped',
        children: 'metadata',
        nodes: [{ label: 'mapped', children: 'metadata', nodes: [] }],
      },
      { label: 'mapped', children: 'metadata', nodes: [] },
    ])
    expect(result[0]).not.toBe(result[1])
    expect(mapped.nodes).toBe('old')
    expectTypeOf(result).toEqualTypeOf<TreeNode<typeof mapped, 'nodes'>[]>()
  })

  it('空树返回新空数组，不调用映射函数', () => {
    const mapper = vi.fn((node: Item) => ({ id: node.id }))

    expect(mapTree([], mapper)).toEqual([])
    expect(mapper).not.toHaveBeenCalled()
  })

  it('透传映射函数的错误并停止遍历', () => {
    const error = new Error('mapping failed')
    const mapper = vi.fn((node: Item) => {
      if (node.id === 2) throw error
      return { id: node.id }
    })

    expect(() => mapTree(tree, mapper)).toThrow(error)
    expect(mapper.mock.calls.map(([node]) => node.id)).toEqual([1, 2])
  })
})

it('深层树的转换、查找、筛选和映射不依赖递归调用栈', () => {
  const list = Array.from({ length: 15_000 }, (_, id) => ({
    id,
    parentId: id === 0 ? null : id - 1,
  }))
  const deepTree = listToTree(list)

  expect(treeToList(deepTree)).toEqual(list)
  expect(findTreeNode(deepTree, (node) => node.id === 14_999)?.id).toBe(14_999)
  expect(findTreePath(deepTree, (node) => node.id === 14_999)).toHaveLength(15_000)

  const mapped = mapTree(deepTree, (node) => ({ value: node.id }))
  expect(treeToList(mapped)).toEqual(list.map(({ id }) => ({ value: id })))

  const filtered = filterTree(deepTree, (node) => node.id === 14_999)
  expect(treeToList(filtered)).toEqual(list)
  expect(filterTree(deepTree, () => false)).toEqual([])
})
