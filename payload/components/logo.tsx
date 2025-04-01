import React from "react"
import Image from "next/image"
import clsx from "clsx"

interface Props {
  width?: number
  height?: number
  className?: string
  loading?: "lazy" | "eager"
  type?: "primary" | "secondary"
  priority?: "auto" | "high" | "low"
}

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className, type = "primary" } = props

  const loading = loadingFromProps || "lazy"
  const priority = priorityFromProps || "low"

  return (
    <Image
      alt="Tiffin Manager"
      width={props.width || 80}
      height={props.height || 80}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={clsx("", className)}
      src={type === "primary" ? "/images/logo-512.svg" : "/icons/apple-icon.png"}
    />
  )
}
