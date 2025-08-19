import path from "node:path"

const _Path = process.cwd()
const Plugin_Name = "voicevox-plugin"
const Plugin_Path = `${_Path}/plugins/${Plugin_Name}`
const Res_Path = `${Plugin_Path}/resources`

export { _Path as Path, Plugin_Name, Plugin_Path, Res_Path }
