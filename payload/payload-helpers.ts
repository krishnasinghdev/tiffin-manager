import type { Metadata } from "next"
import { CollectionSlug, PayloadRequest } from "payload"

import env from "@/lib/env"

import canUseDOM from "../lib/canUseDOM"
import type { Config, Media, Page, Post } from "../types/payload-types"

export const toKebabCase = (string: string): string =>
  string
    ?.replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase()

const isObject = (item: unknown): item is Record<string, unknown> => item !== null && typeof item === "object" && !Array.isArray(item)
export function deepMerge<T extends Record<string, unknown>, S extends Record<string, unknown>>(target: T, source: S): T & S {
  const output = { ...target } as T & S

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key as keyof T & S] = source[key] as (T & S)[keyof T & S]
        } else {
          output[key as keyof T & S] = deepMerge(
            target[key] as Record<string, unknown>,
            source[key] as Record<string, unknown>
          ) as (T & S)[keyof T & S]
        }
      } else {
        output[key as keyof T & S] = source[key] as (T & S)[keyof T & S]
      }
    })
  }

  return output
}

export const formatAuthors = (authors: NonNullable<NonNullable<Post["populatedAuthors"]>[number]>[]) => {
  // Ensure we don't have any authors without a name
  const authorNames = authors.map((author) => author.name).filter(Boolean)

  if (authorNames.length === 0) return ""
  if (authorNames.length === 1) return authorNames[0]
  if (authorNames.length === 2) return `${authorNames[0]} and ${authorNames[1]}`

  return `${authorNames.slice(0, -1).join(", ")} and ${authorNames[authorNames.length - 1]}`
}

export const formatDateTime = (timestamp: string): string => {
  const now = new Date()
  let date = now
  if (timestamp) date = new Date(timestamp)
  const months = date.getMonth()
  const days = date.getDate()
  // const hours = date.getHours();
  // const minutes = date.getMinutes();
  // const seconds = date.getSeconds();

  const MM = months + 1 < 10 ? `0${months + 1}` : months + 1
  const DD = days < 10 ? `0${days}` : days
  const YYYY = date.getFullYear()
  // const AMPM = hours < 12 ? 'AM' : 'PM';
  // const HH = hours > 12 ? hours - 12 : hours;
  // const MinMin = (minutes < 10) ? `0${minutes}` : minutes;
  // const SS = (seconds < 10) ? `0${seconds}` : seconds;

  return `${MM}/${DD}/${YYYY}`
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ""}`
  }

  if (env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  return env.NEXT_PUBLIC_SERVER_URL || ""
}

export const getServerSideURL = () => {
  let url = env.NEXT_PUBLIC_SERVER_URL

  if (!url && env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  if (!url) {
    url = `http://localhost:${env.PORT ?? 4000}`
  }

  return url
}

const getImageURL = (image?: Media | Config["db"]["defaultIDType"] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + "/og.png"

  if (image && typeof image === "object" && "url" in image) {
    const ogUrl = image.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

export const generateMeta = async (args: { doc: Partial<Page> | Partial<Post> | null }): Promise<Metadata> => {
  const { doc } = args

  const ogImage = getImageURL(doc?.meta?.image)

  const title = doc?.meta?.title ? doc?.meta?.title + " | Tiffin Manager" : "Tiffin Manager"
  const description =
    doc?.meta?.description || "Tiffin Manager is a complete solution that helps you manage and grow your tiffin service business."
  return {
    description,
    openGraph: mergeOpenGraph({
      description,
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: Array.isArray(doc?.slug) ? doc?.slug.join("/") : "/",
    }),
    title,
  }
}

const collectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  posts: "/posts",
  pages: "",
}

type Props = {
  collection: keyof typeof collectionPrefixMap
  slug: string
  req: PayloadRequest
}

export const generatePreviewPath = ({ collection, slug }: Props) => {
  const encodedParams = new URLSearchParams({
    slug,
    collection,
    path: `${collectionPrefixMap[collection]}/${slug}`,
    previewSecret: env.PREVIEW_SECRET || "",
  })

  const url = `/next/preview?${encodedParams.toString()}`

  return url
}

const defaultOpenGraph: Metadata["openGraph"] = {
  type: "website",
  description: "Tiffin Manager is a complete solution that helps you manage and grow your tiffin service business.",
  images: [
    {
      url: `${getServerSideURL()}/website-template-OG.png`,
    },
  ],
  siteName: "Tiffin Manager",
  title: "Tiffin Manager",
}

export const mergeOpenGraph = (og?: Metadata["openGraph"]): Metadata["openGraph"] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
