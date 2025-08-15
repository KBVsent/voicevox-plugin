import fs from 'node:fs'
import chalk from 'chalk'

// 全局对象准备，兼容其他插件
if (!global.segment) {
  global.segment = (await import('oicq')).segment
}

if (!global.core) {
  try {
    global.core = (await import('oicq')).core
  } catch (err) {}
}

if (!global.uploadRecord) {
  try {
    // 复用 earth-k-plugin 的 uploadRecord 工具
    global.uploadRecord = (await import('../earth-k-plugin/model/uploadRecord.js')).default
  } catch (err) {
    global.uploadRecord = segment.record
  }
}

let ret = []

logger.info(chalk.rgb(120, 200, 255)(`--------- VoiceVox TTS ---------`))
logger.info(chalk.rgb(120, 200, 255)(`VoiceVox TTS 插件载入中 ...`))
logger.info(chalk.rgb(120, 200, 255)(`--------------------------------`))

const base = './plugins/voicevox-plugin/apps'
const files = fs.readdirSync(base).filter((f) => f.endsWith('.js'))

files.forEach((file) => {
  ret.push(import(`./apps/${file}`))
})

ret = await Promise.allSettled(ret)

let apps = {}
for (let i in files) {
  let name = files[i].replace('.js', '')
  if (ret[i].status !== 'fulfilled') {
    logger.error(`载入插件错误：${logger.red(name)}`)
    logger.error(ret[i].reason)
    continue
  }
  apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}

export { apps }
