import React from "react"
import Image from "next/image"
import clsx from "clsx"

interface Props {
  className?: string
  loading?: "lazy" | "eager"
  priority?: "auto" | "high" | "low"
}

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || "lazy"
  const priority = priorityFromProps || "low"

  return (
    <Image
      alt="Payload Logo"
      width={90}
      height={90}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={clsx("", className)}
      src="/images/logo-512.svg"
    />
  )
}
