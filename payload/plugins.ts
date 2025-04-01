import { formBuilderPlugin } from "@payloadcms/plugin-form-builder"
import { nestedDocsPlugin } from "@payloadcms/plugin-nested-docs"
import { redirectsPlugin } from "@payloadcms/plugin-redirects"
import { searchPlugin } from "@payloadcms/plugin-search"
import { seoPlugin } from "@payloadcms/plugin-seo"
import { GenerateTitle, GenerateURL } from "@payloadcms/plugin-seo/types"
import { FixedToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical"
import { uploadthingStorage } from "@payloadcms/storage-uploadthing"
import { Plugin } from "payload"

import { Page, Post } from "@/types/payload-types"
import { revalidateRedirects } from "@/payload/hooks/revalidate-redirects"
import { getServerSideURL } from "@/payload/payload-helpers"
import { beforeSyncWithSearch } from "@/payload/search/before-sync"
import { searchFields } from "@/payload/search/field-overrides"
import env from "@/lib/env"

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Tiffin Manager` : "Tiffin Manager"
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ["pages", "posts"],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ("name" in field && field.name === "from") {
            return {
              ...field,
              admin: {
                description: "You will need to rebuild the website when changing this field.",
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ["categories"],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ""),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ("name" in field && field.name === "confirmationMessage") {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => [...rootFeatures, FixedToolbarFeature()],
              }),
            }
          }
          return field
        })
      },
    },
  }),
  searchPlugin({
    collections: ["posts"],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
  uploadthingStorage({
    collections: {
      media: true,
    },
    options: {
      token: env.UPLOADTHING_TOKEN,
      acl: "public-read",
    },
  }),
]
