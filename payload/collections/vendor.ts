import { MetaDescriptionField, MetaImageField, MetaTitleField, OverviewField, PreviewField } from "@payloadcms/plugin-seo/fields"
import { FixedToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical"
import type { CollectionConfig } from "payload"

import { slugField } from "@/payload/fields/slug"

import { authenticated } from "./access/authenticated"
import { authenticatedOrPublished } from "./access/authenticatedOrPublished"

export const Vendors: CollectionConfig = {
  slug: "vendors",
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  admin: {
    defaultColumns: ["title", "slug", "updatedAt"],
    useAsTitle: "title",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      minLength: 1,
    },
    {
      type: "tabs",
      tabs: [
        {
          fields: [
            {
              name: "vendor_name",
              type: "text",
              required: true,
            },
            {
              name: "phone",
              type: "text",
              required: true,
            },
            {
              name: "address",
              type: "textarea",
              required: true,
            },
            {
              name: "description",
              type: "richText",
              required: true,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => [...rootFeatures, FixedToolbarFeature()],
              }),
            },
            {
              name: "logo",
              type: "upload",
              relationTo: "media",
            },
            {
              name: "plans",
              type: "relationship",
              relationTo: "plans",
              hasMany: true,
            },
            {
              name: "serive_areas",
              type: "relationship",
              relationTo: "locations",
              hasMany: true,
              required: true,
            },
            {
              name: "is_featured",
              type: "checkbox",
              defaultValue: false,
            },
          ],
          label: "Information",
        },
        {
          name: "meta",
          label: "SEO",
          fields: [
            OverviewField({
              titlePath: "meta.title",
              descriptionPath: "meta.description",
              imagePath: "meta.image",
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: "media",
            }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: "meta.title",
              descriptionPath: "meta.description",
            }),
          ],
        },
      ],
    },
    ...slugField("title"),
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
    },
    maxPerDoc: 50,
  },
}
