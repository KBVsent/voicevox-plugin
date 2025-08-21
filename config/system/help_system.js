/*
* 此配置文件为系统使用，请勿修改，否则可能无法正常使用
* */

export const helpCfg = {
  title: "VoiceVox帮助",
  subTitle: "[VoiceVox插件] Yunzai-Bot & VoiceVox-Plugin",
  columnCount: 4,
  colWidth: 300,
  theme: "all",
  themeExclude: [ "default" ],
  style: {
    fontColor: "#ceb78b",
    descColor: "#eee",
    contBgColor: "rgba(6, 21, 31, .5)",
    contBgBlur: 0,
    headerBgColor: "rgba(255, 222, 142, 0.44)",
    rowBgColor1: "rgba(255, 166, 99, 0.23)",
    rowBgColor2: "rgba(251, 113, 107, 0.35)"
  }
}

export const helpList = [
  {
    "group": "基础功能",
    "list": [
      {
        "icon": 1,
        "title": "#vv 文本",
        "desc": "使用默认说话人合成语音"
      },
      {
        "icon": 2,
        "title": "#vv <说话人> 文本",
        "desc": "使用指定说话人合成语音"
      },
      {
        "icon": 3,
        "title": "#cvv 文本",
        "desc": "中文合成语音"
      },
      {
        "icon": 4,
        "title": "#cvv <说话人> 文本",
        "desc": "指定说话人合成中文语音"
      },
      {
        "icon": 5,
        "title": "#vv list",
        "desc": "查看可用的说话人列表"
      },
      {
        "icon": 6,
        "title": "#vv list <筛选词>",
        "desc": "按关键词筛选说话人"
      }
    ]
  },
  {
    "group": "个人设置",
    "list": [
      {
        "icon": 7,
        "title": "#vv set speaker <名称>",
        "desc": "设置个人偏好说话人"
      },
      {
        "icon": 8,
        "title": "#vv set pitch <值>",
        "desc": "设置音调（pitch）"
      },
      {
        "icon": 9,
        "title": "#vv set speed <值>",
        "desc": "设置语速（speed）"
      },
      {
        "icon": 10,
        "title": "#vv set intonation <值>",
        "desc": "设置语调缩放（intonation）"
      },
      {
        "icon": 11,
        "title": "#vv get",
        "desc": "查看当前个人偏好设置"
      },
      {
        "icon": 12,
        "title": "#vv reset",
        "desc": "重置个人偏好为默认配置"
      }
    ]
  },
  {
    "group": "管理功能",
    "auth": "master",
    "list": [
      {
        "icon": 13,
        "title": "#vv setkey <apiKey>",
        "desc": "设置 VoiceVox API Key"
      },
      {
        "icon": 14,
        "title": "#vv setspace <值>",
        "desc": "设置中文转换是否添加空格分隔"
      },
      {
        "icon": 15,
        "title": "#vv 更新",
        "desc": "更新插件到最新版本"
      }
    ]
  }
]

export const isSys = true
