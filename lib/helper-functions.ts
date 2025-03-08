export const getBadgeColor = (status: string | boolean | undefined) => {
  switch (status) {
    case "":
    case "paid":
    case "staff":
    case "active":
    case "pending":
    case "delivered":
    case "completed":
    case true:
      return "bg-green-500/15 text-green-500 hover:bg-green-500/25"

    case "regular":
    case "current":
    case "inactive":
    case "delivery":
    case "customized":
      return "bg-blue-500/15 text-blue-500 hover:bg-blue-500/25"

    case "off":
    case "left":
    case "unpaid":
    case "deleted":
    case false:
      return "bg-red-500/15 text-red-500 hover:bg-red-500/25"

    case "random":
    case "skipped":
    case "partial_paid":
      return "bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25"

    default:
      return "bg-gray-500/15 text-gray-500 hover:bg-gray-500/25"
  }
}
