# VoiceVox TTS 插件

## 指令说明

### 基本功能
- `#vv 文本` 使用默认或个人偏好 speaker 合成
- `#vv <speaker名称或ID> 文本` 指定 speaker 合成（临时覆盖个人偏好）
- `#vv setkey <apiKey>` 设置 API Key（仅主人）

### 个人偏好设置（持久化到 Redis）
- `#vv set speaker <名称或ID>` 设置个人偏好说话人（支持中文别名）
- `#vv set pitch <value>` 设置个人偏好音调（支持负数）
- `#vv set speed <value>` 设置个人偏好语速（必须为正数）
- `#vv set intonation <value>` 设置个人偏好语调强度（必须为正数）
- `#vv get` 查看当前个人偏好设置
- `#vv reset` 重置个人偏好为默认配置
- `#vv list [筛选词]` 查看可用的说话人列表（支持按名称筛选）

### Speaker 别名支持
支持使用中文别名设置说话人，例如：
- `#vv set speaker 毛豆` （ずんだもん，ID: 3）
- `#vv set speaker 四国metan` （四国めたん，ID: 2）
- `#vv set speaker 年糕` （もち子さん，ID: 20）
- `#vv set speaker 1` （数字ID仍然支持）

### 说话人查询功能
- `#vv list` - 显示所有角色概览
- `#vv list 毛豆` - 查看毛豆相关的所有变体
- `#vv list 四国` - 查看四国相关角色
- `#vv list 3` - 查看ID为3的具体说话人
- `#vv list 护士` - 按关键词搜索相关角色

## 配置文件
- 位置：`plugins/voicevox-plugin/config/config.yaml`
- 接口：`https://deprecatedapis.tts.quest/v2/voicevox/audio/`

## 使用流程
1. 设置 API Key（管理员）：`#vv setkey your_api_key`
2. 查看可用说话人：`#vv list`
3. 设置个人偏好（可选）：`#vv set speaker 毛豆`、`#vv set speed 1.2`
4. 生成语音：`#vv こんにちは` 或 `#vv 年糕 こんにちは`

## 功能特性
- **个人偏好持久化**：每个用户的设置独立保存到 Redis
- **参数优先级**：临时指定 > 个人偏好 > 全局默认
- **兼容音频发送**：复用 Yunzai 的 `uploadRecord`/`segment.record`
- **智能错误处理**：映射 API 错误码为友好提示
