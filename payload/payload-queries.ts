import { unstable_cache } from "next/cache"
import { getPayload } from "payload"

import type { Config } from "@/types/payload-types"
import configPromise from "@/payload/payload.config"

type Collection = keyof Config["collections"]
type Global = keyof Config["globals"]

async function getDocument(collection: Collection, slug: string, depth = 0) {
  const payload = await getPayload({ config: configPromise })

  const page = await payload.find({
    collection,
    depth,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return page.docs[0]
}

export const getCachedDocument = (collection: Collection, slug: string) =>
  unstable_cache(async () => getDocument(collection, slug), [collection, slug], {
    tags: [`${collection}_${slug}`],
  })

async function getGlobal(slug: Global, depth = 0) {
  const payload = await getPayload({ config: configPromise })

  const global = await payload.findGlobal({
    slug,
    depth,
  })

  return global
}

export const getCachedGlobal = (slug: Global, depth = 0) =>
  unstable_cache(async () => getGlobal(slug, depth), [slug], {
    tags: [`global_${slug}`],
  })

// export const getMeUser = async (args?: {
//   nullUserRedirect?: string
//   validUserRedirect?: string
// }): Promise<{
//   token: string
//   user: User
// }> => {
//   const { nullUserRedirect, validUserRedirect } = args || {}
//   const cookieStore = await cookies()
//   const token = cookieStore.get("payload-token")?.value

//   const meUserReq = await fetch(`${getClientSideURL()}/api/users/me`, {
//     headers: {
//       Authorization: `JWT ${token}`,
//     },
//   })

//   const {
//     user,
//   }: {
//     user: User
//   } = await meUserReq.json()

//   if (validUserRedirect && meUserReq.ok && user) {
//     redirect(validUserRedirect)
//   }

//   if (nullUserRedirect && (!meUserReq.ok || !user)) {
//     redirect(nullUserRedirect)
//   }

//   // Token will exist here because if it doesn't the user will be redirected
//   return {
//     token: token!,
//     user,
//   }
// }

export async function getRedirects(depth = 1) {
  const payload = await getPayload({ config: configPromise })

  const { docs: redirects } = await payload.find({
    collection: "redirects",
    depth,
    limit: 0,
    pagination: false,
  })

  return redirects
}

export const getCachedRedirects = () =>
  unstable_cache(async () => getRedirects(), ["redirects"], {
    tags: ["redirects"],
  })
