import fs from "node:fs"
import puppeteer from "../../../../lib/puppeteer/puppeteer.js"

const _path = process.cwd()
const Plugin_Name = "voicevox-plugin"

/**
 * VoiceVox 渲染HTML
 * 模仿DF-Plugin的render.js写法，使用Yunzai的puppeteer
 * @param {string} path 文件路径
 * @param {object} params 参数
 * @param {object} cfg 配置
 */
export default async function(path, params, cfg) {
  let [app, tpl] = path.split("/")
  let resPath = `../../../../../plugins/${Plugin_Name}/resources/`
  
  // 创建目录
  createDir(`data/html/${Plugin_Name}/${app}/${tpl}`, "root")
  
  let data = {
    ...params,
    _plugin: Plugin_Name,
    saveId: params.saveId || params.save_id || tpl,
    tplFile: `./plugins/${Plugin_Name}/resources/${app}/${tpl}.html`,
    pluResPath: resPath,
    _res_path: resPath,
    pageGotoParams: {
      waitUntil: "networkidle0"
    },
    viewport: {
      width: 830,
      height: 1200
    },
    sys: {
      scale: `style=transform:scale(${cfg.scale || 1.2})`,
      copyright: `VoiceVox Plugin - 独立TTS语音合成`
    },
    quality: 100
  }

  // Debug模式保存数据
  if (process.argv.includes("web-debug")) {
    let saveDir = _path + "/data/ViewData/"
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true })
    }
    let file = saveDir + tpl + ".json"
    data._app = app
    fs.writeFileSync(file, JSON.stringify(data))
  }

  // 使用Yunzai的puppeteer截图
  let base64 = await puppeteer.screenshot(`${Plugin_Name}/${app}/${tpl}`, data)
  let ret = true

  if (base64) {
    let { e } = cfg
    ret = await e.reply(base64)
  }
  
  return cfg.retMsgId ? ret : true
}

/**
 * 创建目录
 * @param {string} dirname 目录名
 * @param {string} root 根目录
 */
function createDir(dirname, root = "") {
  const targetPath = root ? `${root}/${dirname}` : dirname
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true })
  }
}
