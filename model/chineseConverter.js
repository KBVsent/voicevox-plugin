import fetch from 'node-fetch'

/**
 * 中文转片假名 API 模块
 * 使用 namehenkan.com API 将中文转换为日语片假名
 */

/**
 * 检测文本是否包含中文字符（简体/繁体）
 * @param {string} text - 要检测的文本
 * @returns {boolean} 是否包含中文
 */
export function containsChinese(text) {
  // Unicode 范围：
  // \u4e00-\u9fff: CJK统一汉字
  // \u3400-\u4dbf: CJK扩展A
  // \uf900-\ufaff: CJK兼容汉字
  const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/
  return chineseRegex.test(text)
}

/**
 * 转换中文为片假名
 * @param {string} text - 中文文本
 * @param {boolean} addSpaces - 是否在片假名之间添加空格，默认 false
 * @returns {Promise<string>} 转换后的片假名文本
 */
export async function convertChineseToKatakana(text, addSpaces = false) {
  try {
    // 如果不包含中文，直接返回原文
    if (!containsChinese(text)) {
      return text
    }

    // 分割文本为中文和非中文部分进行处理
    const segments = []
    let currentSegment = ''
    let isChineseSegment = false
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const isCharChinese = containsChinese(char)
      
      // 如果字符类型改变，保存当前段落
      if (isCharChinese !== isChineseSegment && currentSegment.length > 0) {
        segments.push({
          text: currentSegment,
          isChinese: isChineseSegment
        })
        currentSegment = ''
      }
      
      currentSegment += char
      isChineseSegment = isCharChinese
    }
    
    // 添加最后一个段落
    if (currentSegment.length > 0) {
      segments.push({
        text: currentSegment,
        isChinese: isChineseSegment
      })
    }
    
    // 处理每个段落
    const convertedSegments = await Promise.all(
      segments.map(async (segment) => {
        if (!segment.isChinese) {
          return segment.text
        }
        
        // 对中文段落进行转换
        return await convertSingleChinese(segment.text, addSpaces)
      })
    )
    
    return convertedSegments.join('').trim()  // 清理首尾空格
    
  } catch (error) {
    console.error('中文转片假名失败:', error)
    // 转换失败时返回原文
    return text
  }
}

/**
 * 转换单个中文字符串为片假名
 * @param {string} chineseText - 中文文本
 * @param {boolean} addSpaces - 是否在片假名之间添加空格
 * @returns {Promise<string>} 片假名文本
 */
async function convertSingleChinese(chineseText, addSpaces = false) {
  try {
    
    let result = ''
    
    // 逐字符转换以获得更好的效果
    for (let i = 0; i < chineseText.length; i++) {
      const char = chineseText[i]
      
      if (containsChinese(char)) {
        try {
          // 将当前字符作为姓，固定字"试"作为名
          const formData = new URLSearchParams()
          formData.append('last', char)
          formData.append('first', '试')
          
          const response = await fetch('https://namehenkan.com/ajax.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: formData.toString()
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data && data.Pinyin_k_sei) {
              // 解码 Unicode 转义序列并取得片假名
              const katakana = decodeUnicodeEscapes(data.Pinyin_k_sei)
              // 根据配置决定是否添加空格
              result += addSpaces ? katakana + ' ' : katakana
            } else {
              // 如果API没有返回期望的结果，保留原字符
              result += char
            }
          } else {
            // HTTP 错误时保留原字符
            result += char
          }
          
          // 添加延迟避免请求过于频繁
          await new Promise(resolve => setTimeout(resolve, 50))
          
        } catch (error) {
          console.error(`转换字符 "${char}" 失败:`, error.message)
          // 单个字符转换失败时保留原字符
          result += char
        }
      } else {
        // 非中文字符直接保留
        result += char
      }
    }
    
    return result.trim()  // 清理首尾空格
    
  } catch (error) {
    console.error('转换中文字符串失败:', error)
    return chineseText
  }
}

/**
 * 解码 Unicode 转义序列
 * @param {string} str - Unicode格式的字符串
 * @returns {string} 解码后的字符串
 */
function decodeUnicodeEscapes(str) {
  try {
    // 处理 Unicode 转义序列
    return str.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16))
    })
  } catch (error) {
    console.error('Unicode 解码失败:', error)
    return str
  }
}

/**
 * 批量转换多个中文字符为片假名（用于优化性能）
 * @param {string[]} chineseChars - 中文字符数组  
 * @returns {Promise<string[]>} 片假名数组
 */
export async function batchConvertChinese(chineseChars) {
  const results = []
  
  for (const char of chineseChars) {
    if (containsChinese(char)) {
      const converted = await convertSingleChinese(char)
      results.push(converted)
    } else {
      results.push(char)
    }
    
    // 批量处理时也添加延迟
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  
  return results
}

export default {
  containsChinese,
  convertChineseToKatakana,
  batchConvertChinese
}
