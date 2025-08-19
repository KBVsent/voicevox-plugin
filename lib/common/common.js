import render from "../puppeteer/render.js"

/**
 * VoiceVox 通用函数
 * 模仿DF-Plugin的common写法
 */

/**
 * 休眠函数
 * @param {number} ms - 毫秒
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default {
  render,
  sleep
}
