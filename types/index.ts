import { Icon } from "@/lib/icons"

export interface NavToolsProps {
  name: string
  url: string
  icon: Icon
  status: "active" | "soon" | "upgrade"
}
