import React from "react"
import type { StaticImageData } from "next/image"

import type { MediaBlock as MediaBlockProps } from "@/types/payload-types"
import { Media } from "@/payload/components/media"
import { cn } from "@/lib/utils"

type Props = MediaBlockProps & {
  breakout?: boolean
  captionClassName?: string
  className?: string
  enableGutter?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
  disableInnerContainer?: boolean
}

export const MediaBlock: React.FC<Props> = (props) => {
  const { className, enableGutter = true, imgClassName, media, staticImage } = props

  return (
    <div
      className={cn(
        "",
        {
          container: enableGutter,
        },
        className
      )}
    >
      {(media || staticImage) && (
        <Media imgClassName={cn("border border-border rounded-[0.8rem]", imgClassName)} resource={media} src={staticImage} />
      )}
    </div>
  )
}
