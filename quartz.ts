import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { registerDevUniConditions } from "./quartz/plugins/loader/conditions"
import PrimaryNavigation from "./quartz/components/PrimaryNavigation"
import DevUniFooter from "./quartz/components/DevUniFooter"

registerDevUniConditions()

const navigation = PrimaryNavigation()
const footer = DevUniFooter()
const pageTypesWithNavigation = ["content", "folder", "tag", "canvas", "bases"]
const layoutOverrides = {
  defaults: { header: [navigation], footer },
  byPageType: Object.fromEntries([
    ...pageTypesWithNavigation.map(
      (pageType) => [pageType, { header: [navigation], footer }] as const,
    ),
    ["404", { footer }] as const,
  ]),
}

const config = await loadQuartzConfig(undefined, layoutOverrides)
export default config
export const layout = await loadQuartzLayout(layoutOverrides)
