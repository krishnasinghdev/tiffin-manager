import { type NextRequest } from "next/server"

type Req = NextRequest & { auth: { user: { _id: string } } | null }

export const GET = (req: Req) => {
  if (!req.auth) return Response.json({ message: "Not authenticated" }, { status: 401 })
  try {
    return Response.json(
      {
        message: "Hello from custom route",
      },
      { status: 200 }
    )
  } catch (e) {
    console.error(e)
    return Response.json({ message: "Failed to fetch bugs" }, { status: 400 })
  }
}

export const POST = (req: Req) => {
  if (!req.auth) return Response.json({ message: "Not authenticated" }, { status: 401 })
  try {
    return Response.json(
      {
        message: "Hello from custom route",
      },
      { status: 200 }
    )
  } catch (e) {
    console.error(e)
    return Response.json({ message: "Failed to update user" }, { status: 400 })
  }
}
