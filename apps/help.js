import lodash from "lodash"
import { common, Data } from "../components/index.js"
import Theme from "../model/help/theme.js"

export class help extends plugin {
  constructor() {
    super({
      name: "VoiceVox:帮助",
      dsc: "VoiceVox插件命令帮助",
      event: "message",
      priority: 2000,
      rule: [
        {
          reg: "^#?vv帮助$",
          fnc: "help"
        }
      ]
    })
  }

  async help(e) {
    let custom = {}
    let help = {}

    let { diyCfg, sysCfg } = await Data.importCfg("help")

    custom = help

    let helpConfig = lodash.defaults(diyCfg.helpCfg || {}, custom.helpCfg, sysCfg.helpCfg)
    let helpList = diyCfg.helpList || custom.helpList || sysCfg.helpList
    let helpGroup = []

    lodash.forEach(helpList, (group) => {
      if (group.auth && group.auth === "master" && !e.isMaster) {
        return true
      }

      lodash.forEach(group.list, (help) => {
        let icon = help.icon * 1
        if (!icon) {
          help.css = "display:none"
        } else {
          let x = (icon - 1) % 10
          let y = (icon - x - 1) / 10
          help.css = `background-position:-${x * 50}px -${y * 50}px`
        }
      })

      helpGroup.push(group)
    })
    let themeData = await Theme.getThemeData(diyCfg.helpCfg || {}, sysCfg.helpCfg || {})

    return await common.render("help/index", {
      helpCfg: helpConfig,
      helpGroup,
      ...themeData,
      element: "default"
    }, { e, scale: 1.6 })
  }
}
