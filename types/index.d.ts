export type IsHidden = boolean

declare module 'claude-code' {
  interface PluginState {
    'bash-why': { isHidden: IsHidden }
  }
}
