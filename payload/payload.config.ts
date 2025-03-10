import { mongooseAdapter } from "@payloadcms/db-mongodb"
import { resendAdapter } from "@payloadcms/email-resend"
import { buildConfig, PayloadRequest } from "payload"
import sharp from "sharp"

import { defaultLexical } from "@/payload/fields/default-lexical"
import { getServerSideURL } from "@/payload/payload-helpers"
import env from "@/lib/env"

import { Categories } from "./collections/categories"
import { Locations } from "./collections/locations"
import { Media } from "./collections/media"
import { Pages } from "./collections/pages"
import { Plans } from "./collections/plans"
import { Posts } from "./collections/posts"
import { Users } from "./collections/users"
import { Vendors } from "./collections/vendor"
import { Footer } from "./global/footer/config"
import { Header } from "./global/header/config"
import { plugins } from "./plugins"

export default buildConfig({
  email: resendAdapter({
    defaultFromAddress: "tm@email.witheb.in",
    defaultFromName: "Tiffin Manager",
    apiKey: env.RESEND_API_KEY,
  }),
  admin: {
    importMap: {
      baseDir: "./payload",
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: "Mobile",
          name: "mobile",
          width: 375,
          height: 667,
        },
        {
          label: "Tablet",
          name: "tablet",
          width: 768,
          height: 1024,
        },
        {
          label: "Desktop",
          name: "desktop",
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  editor: defaultLexical,
  db: mongooseAdapter({
    url: env.MONGODB_URL,
  }),
  collections: [Pages, Posts, Media, Categories, Users, Locations, Vendors, Plans],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  plugins: [...plugins],
  secret: env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: "./types/payload-types.ts",
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        if (req.user) return true

        const authHeader = req.headers.get("authorization")
        return authHeader === `Bearer ${env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})
