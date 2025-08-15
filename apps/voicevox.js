import fetch from 'node-fetch'
import plugin from '../../../lib/plugins/plugin.js'
import YAML from 'yaml'
import fs from 'fs'
import { findSpeaker, getSpeakerName, getSpeakerList } from '../config/speakers.js'

/**
 * VoiceVox TTS 语音合成
 * 指令：
 *  - #vv 文本
 *  - #vv <speaker名称或ID> 文本
 *  - #vv setkey <apiKey>   （仅主人/管理员，简单判断：e.isMaster）
 *  - #vv set speaker <名称或ID>  设置个人偏好说话人
 *  - #vv set pitch <value> 设置个人偏好音调
 *  - #vv set speed <value> 设置个人偏好语速
 *  - #vv set intonation <value> 设置个人偏好语调
 *  - #vv get               查看个人偏好设置
 *  - #vv reset             重置个人偏好
 *  - #vv list [筛选词]      查看可用的说话人列表（可筛选）
 */
export class VoiceVoxTTS extends plugin {
  constructor() {
    super({
      name: '[VoiceVox] 文本转语音',
      dsc: '使用 VoiceVox TTS 接口，将文本生成语音并发送',
      event: 'message',
      priority: 145,
      rule: [
        {
          reg: '^#vv(.*)$',
          fnc: 'tts'
        }
      ]
    })
  }

  /**
   * 获取用户偏好设置的 Redis key
   */
  getUserPrefKey(userId) {
    return `voicevox:user:${userId}:prefs`
  }

  /**
   * 获取用户偏好设置
   */
  async getUserPrefs(userId) {
    try {
      const data = await redis.get(this.getUserPrefKey(userId))
      return data ? JSON.parse(data) : {}
    } catch (err) {
      logger.error('获取用户偏好失败:', err)
      return {}
    }
  }

  /**
   * 保存用户偏好设置
   */
  async setUserPrefs(userId, prefs) {
    try {
      await redis.set(this.getUserPrefKey(userId), JSON.stringify(prefs))
      return true
    } catch (err) {
      logger.error('保存用户偏好失败:', err)
      return false
    }
  }

  /**
   * 处理 TTS 指令
   * 支持：#vv [speakerId] 文本
   */
  async tts(e) {
    try {
      const cfg = YAML.parse(fs.readFileSync('./plugins/voicevox-plugin/config/config.yaml', 'utf8'))
      const prefix = cfg.command || '#vv'

      let raw = e.msg.trim()
      if (!raw.startsWith(prefix)) return false

      // 子命令：设置 key
      if (/^#vv\s+setkey\s+/i.test(raw)) {
        if (!e.isMaster) return e.reply('无权限')
        const apiKey = raw.replace(/^#vv\s+setkey\s+/i, '').trim()
        if (!apiKey) return e.reply('用法：#vv setkey <apiKey>')
        cfg.apiKey = apiKey
        fs.writeFileSync('./plugins/voicevox-plugin/config/config.yaml', YAML.stringify(cfg))
        return e.reply('VoiceVox ApiKey 已更新')
      }

      // 子命令：设置个人偏好
      if (/^#vv\s+set\s+/i.test(raw)) {
        return await this.handleSetPrefs(e, raw)
      }

      // 子命令：查看个人偏好
      if (/^#vv\s+get\s*$/i.test(raw)) {
        return await this.handleGetPrefs(e)
      }

      // 子命令：重置个人偏好
      if (/^#vv\s+reset\s*$/i.test(raw)) {
        return await this.handleResetPrefs(e)
      }

      // 子命令：查看说话人列表
      if (/^#vv\s+list/i.test(raw)) {
        const searchTerm = raw.replace(/^#vv\s+list\s*/i, '').trim()
        return await this.handleSpeakerList(e, searchTerm)
      }

      // 获取用户偏好设置
      const userId = e.user_id || e.sender?.user_id
      const userPrefs = await this.getUserPrefs(userId)

      // 解析 speaker 与文本
      let content = raw.replace(prefix, '').trim()
      if (!content) return e.reply('用法：#vv [speaker名称或ID] 文本\n或：#vv set <参数> <值>\n或：#vv get\n或：#vv list')

      // 使用用户偏好设置作为默认值
      let speaker = userPrefs.speaker ?? cfg.speaker ?? 0
      let pitch = userPrefs.pitch ?? cfg.pitch ?? 0
      let intonationScale = userPrefs.intonationScale ?? cfg.intonationScale ?? 1
      let speed = userPrefs.speed ?? cfg.speed ?? 1

      // 如果首个 token 是数字或speaker名称，则认为是 speaker
      const tokens = content.split(/\s+/)
      if (tokens.length >= 2) {
        const speakerId = findSpeaker(tokens[0])
        if (speakerId !== null) {
          speaker = speakerId
          content = tokens.slice(1).join(' ')
        }
      }

      if (!cfg.apiKey) {
        return e.reply('请先配置 VoiceVox ApiKey：#vv setkey <apiKey>')
      }

      // 调用 API 合成
      const baseUrl = (cfg.baseUrl || 'https://deprecatedapis.tts.quest/v2/voicevox/audio/').replace(/\/$/, '/')
      const url = `${baseUrl}?key=${encodeURIComponent(cfg.apiKey)}&speaker=${encodeURIComponent(speaker)}&pitch=${encodeURIComponent(pitch)}&intonationScale=${encodeURIComponent(intonationScale)}&speed=${encodeURIComponent(speed)}&text=${encodeURIComponent(content)}`

      await e.reply('正在合成语音，请稍等…')

      const res = await fetch(url)

      // 错误返回是 JSON 文本，成功为 audio/x-wav
      const contentType = res.headers.get('content-type') || ''

      if (!res.ok) {
        const txt = await res.text()
        return e.reply(`合成失败(${res.status})：${txt}`)
      }

      if (!contentType.includes('audio')) {
        // 错误文本：invalidApiKey / failed / notEnoughPoints / 其他
        let bodyText = ''
        try {
          bodyText = await res.text()
        } catch {}
        const map = {
          invalidApiKey: 'API Key 无效',
          failed: '合成失败',
          notEnoughPoints: '积分不足（notEnoughPoints）'
        }
        const tip = map[bodyText?.trim()] || (bodyText ? `接口返回：${bodyText}` : '接口未返回音频')
        return e.reply(`合成失败：${tip}`)
      }

      // 直接拿文件直链上传（uploadRecord 支持 URL）
      try {
        const msg = await uploadRecord(res.url || url, 0, false)
        await e.reply(msg)
      } catch (err) {
        // 回退为 segment.record(url)
        try {
          const msg2 = await segment.record(res.url || url)
          await e.reply(msg2)
        } catch (err2) {
          // 如果直链方式失败，退化为下载再上传（临时文件）
          const buf = Buffer.from(await res.arrayBuffer())
          const tmp = `temp/voicevox_${Date.now()}.wav`
          fs.mkdirSync('temp', { recursive: true })
          fs.writeFileSync(tmp, buf)
          try {
            const msg3 = await uploadRecord(tmp, 0, false)
            await e.reply(msg3)
          } finally {
            try { fs.unlinkSync(tmp) } catch {}
          }
        }
      }
    } catch (error) {
      logger.error(error)
      e.reply('语音合成发生异常')
    }

    return true
  }

  /**
   * 处理设置偏好命令
   */
  async handleSetPrefs(e, raw) {
    const userId = e.user_id || e.sender?.user_id
    const userPrefs = await this.getUserPrefs(userId)

    // 解析设置命令
    const setMatch = raw.match(/^#vv\s+set\s+(\w+)\s+(.+)$/i)
    if (!setMatch) {
      return e.reply('用法：\n#vv set speaker <名称或ID>\n#vv set pitch <值>\n#vv set speed <值>\n#vv set intonation <值>')
    }

    const [, param, value] = setMatch

    switch (param.toLowerCase()) {
      case 'speaker':
        const speakerId = findSpeaker(value)
        if (speakerId === null) {
          return e.reply(`未找到说话人"${value}"，使用 #vv list 查看可用列表`)
        }
        userPrefs.speaker = speakerId
        const success1 = await this.setUserPrefs(userId, userPrefs)
        return success1 
          ? e.reply(`已设置说话人为：${getSpeakerName(speakerId)} (ID: ${speakerId})`)
          : e.reply('设置保存失败')
      
      case 'pitch':
        const numValue = parseFloat(value)
        if (isNaN(numValue)) {
          return e.reply('pitch 必须是数字')
        }
        userPrefs.pitch = numValue
        break
      case 'speed':
        const speedValue = parseFloat(value)
        if (isNaN(speedValue) || speedValue <= 0) {
          return e.reply('speed 必须是正数')
        }
        userPrefs.speed = speedValue
        break
      case 'intonation':
        const intonationValue = parseFloat(value)
        if (isNaN(intonationValue) || intonationValue <= 0) {
          return e.reply('intonation 必须是正数')
        }
        userPrefs.intonationScale = intonationValue
        break
      default:
        return e.reply('支持的参数：speaker, pitch, speed, intonation')
    }

    const success = await this.setUserPrefs(userId, userPrefs)
    if (success) {
      return e.reply(`已设置 ${param} = ${param === 'intonation' ? userPrefs.intonationScale : userPrefs[param]}`)
    } else {
      return e.reply('设置保存失败')
    }
  }

  /**
   * 处理查看偏好命令
   */
  async handleGetPrefs(e) {
    const userId = e.user_id || e.sender?.user_id
    const userPrefs = await this.getUserPrefs(userId)
    
    if (Object.keys(userPrefs).length === 0) {
      return e.reply('您还没有设置过个人偏好\n使用 #vv set <参数> <值> 来设置')
    }

    const cfg = YAML.parse(fs.readFileSync('./plugins/voicevox-plugin/config/config.yaml', 'utf8'))
    
    let msg = '您的个人偏好设置：\n'
    msg += `说话人: ${getSpeakerName(userPrefs.speaker ?? cfg.speaker ?? 0)} (ID: ${userPrefs.speaker ?? cfg.speaker ?? 0})\n`
    msg += `音调 (pitch): ${userPrefs.pitch ?? cfg.pitch ?? 0}\n`
    msg += `语调 (intonation): ${userPrefs.intonationScale ?? cfg.intonationScale ?? 1}\n`
    msg += `语速 (speed): ${userPrefs.speed ?? cfg.speed ?? 1}`
    
    return e.reply(msg)
  }

  /**
   * 处理重置偏好命令
   */
  async handleResetPrefs(e) {
    const userId = e.user_id || e.sender?.user_id
    
    try {
      await redis.del(this.getUserPrefKey(userId))
      return e.reply('个人偏好已重置为默认配置')
    } catch (err) {
      logger.error('重置用户偏好失败:', err)
      return e.reply('重置失败')
    }
  }

  /**
   * 处理说话人列表命令
   */
  async handleSpeakerList(e, searchTerm = '') {
    const list = getSpeakerList()
    
    // 如果有搜索词，进行筛选
    if (searchTerm) {
      const filteredList = list.filter(({ name, id }) => {
        const lowerName = name.toLowerCase()
        const lowerSearch = searchTerm.toLowerCase()
        return lowerName.includes(lowerSearch) || 
               name.includes(searchTerm) ||
               id.toString() === searchTerm
      })

      if (filteredList.length === 0) {
        return e.reply(`未找到包含"${searchTerm}"的说话人\n使用 #vv list 查看完整列表`)
      }

      // 显示筛选结果
      let msg = `🔍 搜索"${searchTerm}"的结果：\n\n`
      for (const { name, id } of filteredList) {
        msg += `• ${name} (ID: ${id})\n`
      }
      
      msg += `\n共找到 ${filteredList.length} 个匹配项\n`
      msg += '💡 使用示例：\n'
      msg += `• #vv set speaker ${filteredList[0].name}\n`
      msg += `• #vv ${filteredList[0].name} こんにちは`

      return e.reply(msg)
    }

    // 无搜索词时显示分组概览
    const groupedList = {}
    
    // 按主要角色分组
    for (const { name, id } of list) {
      // 提取主要角色名（去除变体描述）
      const mainName = name.split(/[あ-ん]|甜|傲娇|性感|耳语|窃窃私语|虚弱|哭泣|开心|愤怒|悲伤|温柔|不爽|热血|冷静|兴奋|强势|害羞|惊讶|害怕|元气|撒娇|男孩|实况|胆怯|绝望|严肃|甜甜|二形态|萝莉|轻松|恐怖|悄悄话|觉醒|低血压|女王|人类|玩偶|鬼形态|播报|朗读|第二形态/)[0] || name
      if (!groupedList[mainName]) {
        groupedList[mainName] = []
      }
      groupedList[mainName].push({ name, id })
    }

    // 构建概览消息
    let msg = '🎭 VoiceVox 说话人概览：\n\n'
    let count = 0
    const maxShow = 15 // 限制显示数量

    const sortedGroups = Object.entries(groupedList).sort((a, b) => a[1][0].id - b[1][0].id)

    for (const [mainName, variants] of sortedGroups) {
      if (count >= maxShow) {
        msg += `\n... 还有 ${sortedGroups.length - count} 个角色\n`
        break
      }
      
      const mainId = variants[0].id
      const variantCount = variants.length
      
      msg += `📢 ${mainName} (${mainId})`
      if (variantCount > 1) {
        msg += ` +${variantCount - 1}变体`
      }
      msg += '\n'
      count++
    }

    msg += '\n� 筛选功能：\n'
    msg += '• #vv list 毛豆 - 查看毛豆相关\n'
    msg += '• #vv list 四国 - 查看四国相关\n'
    msg += '• #vv list 护士 - 查看护士相关\n'
    msg += '• #vv list 3 - 查看ID为3的说话人\n\n'
    
    msg += '💡 使用示例：\n'
    msg += '• #vv set speaker 毛豆\n'
    msg += '• #vv 年糕 こんにちは'

    return e.reply(msg)
  }
}
