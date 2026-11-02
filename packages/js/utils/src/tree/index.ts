export type TreeId = string | number

/** 保留业务字段，并将指定子节点字段替换为递归节点数组。 */
export type TreeNode<T, ChildrenKey extends string = 'children'> = Omit<T, ChildrenKey> & {
  [Key in ChildrenKey]: TreeNode<T, ChildrenKey>[]
}

export interface TreeOptions<ChildrenKey extends string = 'children'> {
  childrenKey?: ChildrenKey
}

export interface ListToTreeOptions<
  IdKey extends string = 'id',
  ParentIdKey extends string = 'parentId',
  ChildrenKey extends string = 'children',
> extends TreeOptions<ChildrenKey> {
  idKey?: IdKey
  parentIdKey?: ParentIdKey
}

function* walkTree<T extends object>(
  tree: readonly T[],
  childrenKey: string,
): Generator<{ node: T; path: readonly T[] }> {
  const stack = [tree[Symbol.iterator]()]
  const path: T[] = []

  while (stack.length > 0) {
    const iterator = stack[stack.length - 1]
    if (!iterator) break
    const result = iterator.next()
    if (result.done) {
      stack.pop()
      path.pop()
      continue
    }

    const node = result.value
    path.push(node)
    yield { node, path }
    const children = (node as Record<string, readonly T[] | null | undefined>)[childrenKey]
    if (children?.length) stack.push(children[Symbol.iterator]())
    else path.pop()
  }
}

/** 按深度优先前序展开树；浅拷贝节点并移除子节点字段，不补充 parentId。 */
export function treeToList<T extends object, ChildrenKey extends string = 'children'>(
  tree: readonly T[],
  options: TreeOptions<ChildrenKey> = {},
): Omit<T, ChildrenKey>[] {
  const childrenKey = options.childrenKey ?? 'children'
  const list: Omit<T, ChildrenKey>[] = []
  for (const { node } of walkTree(tree, childrenKey)) {
    const item = { ...node }
    delete (item as Record<string, unknown>)[childrenKey]
    list.push(item)
  }
  return list
}

/** 列表转树；父 ID 为空或不存在时作为根节点，重复 ID 和循环关系抛错。 */
export function listToTree<
  T extends Record<IdKey, TreeId> & Partial<Record<ParentIdKey, TreeId | null | undefined>>,
  IdKey extends string = 'id',
  ParentIdKey extends string = 'parentId',
  ChildrenKey extends string = 'children',
>(
  list: readonly T[],
  options: ListToTreeOptions<IdKey, ParentIdKey, ChildrenKey> = {},
): TreeNode<T, ChildrenKey>[] {
  const idKey = options.idKey ?? ('id' as IdKey)
  const parentIdKey = options.parentIdKey ?? ('parentId' as ParentIdKey)
  const childrenKey = options.childrenKey ?? 'children'
  const nodes = new Map<
    TreeId,
    {
      node: TreeNode<T, ChildrenKey>
      children: TreeNode<T, ChildrenKey>[]
      parentId: TreeId | null | undefined
    }
  >()

  for (const item of list) {
    const id = item[idKey]
    if (nodes.has(id)) throw new Error(`Duplicate tree node ID: ${id}`)
    const children: TreeNode<T, ChildrenKey>[] = []
    const node = { ...item, [childrenKey]: children } as unknown as TreeNode<T, ChildrenKey>
    nodes.set(id, { node, children, parentId: item[parentIdKey] })
  }

  const roots: TreeNode<T, ChildrenKey>[] = []
  const visited = new Set<TreeId>()
  for (const [id, entry] of nodes) {
    // 每条父链只检查一次，避免深层列表退化为平方复杂度。
    const path = new Set<TreeId>()
    let current: TreeId | null | undefined = id
    while (current !== null && current !== undefined && !visited.has(current)) {
      if (path.has(current)) throw new Error(`Cycle detected in tree at ID: ${current}`)
      path.add(current)
      current = nodes.get(current)?.parentId
    }
    for (const ancestorId of path) visited.add(ancestorId)

    const parent = entry.parentId == null ? undefined : nodes.get(entry.parentId)
    if (parent) parent.children.push(entry.node)
    else roots.push(entry.node)
  }
  return roots
}

/** 按深度优先前序查找首个匹配节点，返回原引用；未找到时返回 undefined。 */
export function findTreeNode<T extends object, ChildrenKey extends string = 'children'>(
  tree: readonly T[],
  predicate: (node: T) => boolean,
  options: TreeOptions<ChildrenKey> = {},
): T | undefined {
  for (const { node } of walkTree(tree, options.childrenKey ?? 'children')) {
    if (predicate(node)) return node
  }
  return undefined
}

/** 查找首个匹配节点从根到自身的路径，保留节点引用；未找到时返回 undefined。 */
export function findTreePath<T extends object, ChildrenKey extends string = 'children'>(
  tree: readonly T[],
  predicate: (node: T) => boolean,
  options: TreeOptions<ChildrenKey> = {},
): T[] | undefined {
  for (const { node, path } of walkTree(tree, options.childrenKey ?? 'children')) {
    if (predicate(node)) return [...path]
  }
  return undefined
}
