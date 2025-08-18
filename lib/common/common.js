import render from "../puppeteer/render.js"

/**
 * VoiceVox 通用渲染函数
 * 模仿DF-Plugin的common.render写法
 */
export default {
  /**
   * 渲染模板
   * @param {string} path 模板路径，如 "help/index"
   * @param {object} data 渲染数据
   * @param {object} cfg 配置选项
   */
  async render(path, data, cfg) {
    return await render(path, data, cfg)
  }
}
