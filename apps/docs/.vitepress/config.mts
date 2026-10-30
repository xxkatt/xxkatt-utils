import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/xxkatt-utils/',
  lang: 'zh-CN',
  title: 'xxkatt-utils',
  description: '按语言分区的工具库，提供工具函数的使用指南与 API 文档。',
  themeConfig: {
    nav: [
      { text: '快速开始', link: '/guide/getting-started' },
      { text: 'JavaScript / TypeScript', link: '/js/utils/' },
    ],
    sidebar: [
      {
        text: '指南',
        items: [{ text: '快速开始', link: '/guide/getting-started' }],
      },
      {
        text: '@xxkatt/utils',
        items: [
          { text: '概览', link: '/js/utils/' },
          { text: 'uuid', link: '/js/utils/uuid' },
          { text: 'randomId', link: '/js/utils/random-id' },
          { text: 'download', link: '/js/utils/download' },
          { text: 'debounce', link: '/js/utils/debounce' },
          { text: 'throttle', link: '/js/utils/throttle' },
        ],
      },
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '未找到相关结果',
            resetButtonTitle: '清除搜索',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },
    outline: { label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '返回顶部',
    darkModeSwitchLabel: '切换主题',
  },
})
