import plugin from '../../../lib/plugins/plugin.js'
import YAML from 'yaml'
import fs from 'fs'
import { common } from '../components/index.js'

/**
 * VoiceVox 帮助页面
 * 使用DF-Plugin风格渲染的美化帮助
 */
export class VoiceVoxHelp extends plugin {
  constructor() {
    super({
      name: '[VoiceVox] 帮助',
      dsc: 'VoiceVox TTS 语音合成帮助页面',
      event: 'message',
      priority: 100,  // 更高优先级，确保在主TTS插件之前处理
      rule: [
        {
          reg: '^#vv\\s*帮助$',  // 精确匹配vv帮助命令
          fnc: 'help'
        }
      ]
    })
  }

  /**
   * 渲染帮助页面
   */
  async help(e) {
    try {
      // 读取配置获取命令前缀
      const cfg = YAML.parse(fs.readFileSync('./plugins/voicevox-plugin/config/config.yaml', 'utf8'))
      const prefix = cfg.command || '#vv'

      logger.info('[VoiceVox帮助] 开始渲染帮助页面')

      // 准备渲染数据
      const renderData = {
        prefix: prefix,
        isMaster: e.isMaster || false
      }

      // 使用DF-Plugin风格渲染
      const img = await common.render('help/index', renderData, {
        e,
        scale: 1.2
      })

      if (img) {
        logger.info('[VoiceVox帮助] 帮助页面渲染成功')
        return true
      } else {
        throw new Error('渲染结果为空')
      }
    } catch (error) {
      logger.error('[VoiceVox帮助] 渲染失败:', error)
      // 如果渲染失败，回退到原有的文本帮助
      return this.fallbackTextHelp(e)
    }
  }

  /**
   * 回退的文本帮助
   */
  async fallbackTextHelp(e) {
    try {
      const cfg = YAML.parse(fs.readFileSync('./plugins/voicevox-plugin/config/config.yaml', 'utf8'))
      const prefix = cfg.command || '#vv'

      let msg = `${prefix} 帮助 — 可用指令列表：\n\n`
      msg += `• ${prefix} 文本\n    使用默认说话人合成语音。示例：${prefix} こんにちは\n\n`
      msg += `• ${prefix} <说话人名称或ID> 文本\n    使用指定说话人。示例：${prefix} 3 こんにちは\n\n`
      
      if (e.isMaster) {
        msg += `• ${prefix} setkey <apiKey>\n    （仅主人/管理员）设置 VoiceVox API Key\n\n`
      }
      
      msg += `• ${prefix} set speaker <名称或ID>\n    设置个人偏好说话人\n\n`
      msg += `• ${prefix} set pitch <value>\n    设置音调（pitch）\n\n`
      msg += `• ${prefix} set speed <value>\n    设置语速（speed）\n\n`
      msg += `• ${prefix} set intonation <value>\n    设置语调缩放（intonation）\n\n`
      msg += `• ${prefix} get\n    查看当前个人偏好设置\n\n`
      msg += `• ${prefix} reset\n    重置个人偏好为默认配置\n\n`
      msg += `• ${prefix} list [筛选词]\n    查看可用的说话人列表，可用筛选词或ID进行查找。示例：${prefix} list 毛豆\n\n`
      msg += '提示：说话人名称支持部分匹配，可使用 #vv list 查找完整名称。'

      return e.reply(msg)
    } catch (error) {
      logger.error('VoiceVox回退帮助失败:', error)
      return e.reply('帮助获取失败，请检查插件配置')
    }
  }
}
