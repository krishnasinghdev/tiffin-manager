"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import dayjs from "dayjs"
import { parseAsBoolean, useQueryState } from "nuqs"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { EditVendorSchema, EditVendorType } from "@/types/zod"
import Icons from "@/lib/icons"
import { UploadButton } from "@/lib/uploadthing"
import { SERVICE_AREAS } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormLabel } from "@/components/ui/form"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import CustomField from "@/components/custom-field"
import { clientApi } from "@/components/trpc-provider"

export default function AccountPage() {
  const utils = clientApi.useUtils()
  const [isEditing, setIsEditing] = useQueryState("edit", parseAsBoolean.withDefault(false))
  const [listOpen, setListOpen] = useQueryState("list", parseAsBoolean.withDefault(false))
  const { data, isLoading, refetch } = clientApi.auth.getVendor.useQuery()
  const updateMutation = clientApi.auth.updateVendor.useMutation()
  const [qrCodeUrl, setQrCodeUrl] = useState<string>(data?.data?.qr_code || "")
  const [logoUrl, setLogoUrl] = useState<string>(data?.data?.logo_url || "")

  const form = useForm<EditVendorType>({
    resolver: zodResolver(EditVendorSchema),
    mode: "onTouched",
  })
  const serviceAreaWatch = form.watch("service_area")
  const vendor = data?.data

  useEffect(() => {
    if (vendor && isEditing) {
      form.reset({
        id: vendor.id,
        name: vendor.name,
        org_name: vendor.org_name,
        phone: vendor.phone,
        address: vendor.address,
        service_area: vendor.service_area || [],
        upi_id: vendor.upi_id || "",
        qr_code: vendor.qr_code || "",
        logo_url: vendor.logo_url || "",
      })
      setQrCodeUrl(vendor.qr_code || "")
      setLogoUrl(vendor.logo_url || "")
    }
  }, [vendor, isEditing, form])

  async function onSubmit(values: EditVendorType) {
    if (!form.formState.isDirty && !!values.id) {
      utils.auth.getVendor.invalidate()
      toast.info("No changes were made")
      setIsEditing(false)
      return
    }
    const { success, message } = await updateMutation.mutateAsync(values)
    if (success) {
      refetch()
      toast.success(message)
      setIsEditing(false)
    } else {
      toast.error(message || "Something went wrong")
    }
  }

  if (isLoading) {
    return (
      <Alert variant="default">
        <Icons.AlertTriangle />
        <AlertTitle>Hold on!</AlertTitle>
        <AlertDescription>We are loading your profile...</AlertDescription>
      </Alert>
    )
  }

  if (!data?.success || !vendor) {
    return (
      <Alert variant="destructive">
        <Icons.AlertTriangle />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Unable to load vendor profile</AlertDescription>
      </Alert>
    )
  }

  if (isEditing) {
    return (
      <Card className="xl:w-1/2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Edit Vendor Profile</CardTitle>
          <Button variant="outline" onClick={() => setIsEditing(false)} disabled={updateMutation.isPending}>
            <Icons.Cancel />
            Cancel
          </Button>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <CustomField type="text" control={form.control} name="name" label="Name" />
                <CustomField type="number" control={form.control} name="phone" label="Phone" />
              </div>
              <CustomField type="text" control={form.control} name="org_name" label="Organization Name" />
              <CustomField type="textarea" control={form.control} name="address" label="Address" className="sm:col-span-2" />

              <CustomField
                type="multi_select"
                control={form.control}
                name="service_area"
                label="Serice Areas"
                className="sm:col-span-2"
                options={SERVICE_AREAS}
                listOpen={listOpen}
                setListOpen={setListOpen}
              />

              <FormLabel className="mb-2 block text-gray-500">Selected Areas:</FormLabel>
              <div className="flex flex-wrap gap-2">
                {serviceAreaWatch?.length &&
                  serviceAreaWatch.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                    >
                      {area}
                    </span>
                  ))}
              </div>

              <CustomField type="text" control={form.control} name="upi_id" label="Your UPI ID" />
              <FormLabel className="mb-2 block text-gray-500">Upload Logo (500x500)</FormLabel>
              <div className="flex gap-4">
                {logoUrl && (
                  <img
                    key={logoUrl}
                    src={logoUrl}
                    width="100px"
                    height="100px"
                    alt="vendor logo"
                    className="rounded-lg border object-contain p-1"
                  />
                )}
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]?.ufsUrl) {
                      setLogoUrl(res[0].ufsUrl)
                      form.setValue("logo_url", res[0].ufsUrl, {
                        shouldDirty: true,
                        shouldTouch: true,
                      })
                      toast.success("Logo uploaded successfully")
                    }
                  }}
                  onUploadError={(error: Error) => {
                    toast.error(`Upload failed: ${error.message}`)
                  }}
                  appearance={{
                    button:
                      "whitespace-nowrap text-primary-foreground px-8 mt-4 focus-within:ring-primary/90 data-[state=disabled]:bg-primary/70 data-[state=ready]:bg-primary/90 data-[state=readying]:bg-primary/70 data-[state=uploading]:bg-primary/70 data-[state=uploading]:after:bg-primary/90",
                    container: "w-full bg-muted/50 p-2 rounded-lg",
                    allowedContent: "text-xs text-muted-foreground",
                  }}
                />
              </div>

              <FormLabel className="mb-2 block text-gray-500">Upload UPI QR (500x500) </FormLabel>
              <div className="flex gap-4">
                {qrCodeUrl && (
                  <img
                    key={qrCodeUrl}
                    src={qrCodeUrl}
                    width="100px"
                    height="100px"
                    alt="QR Code"
                    className="rounded-lg border object-contain p-1"
                  />
                )}
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]?.ufsUrl) {
                      setQrCodeUrl(res[0].ufsUrl)
                      form.setValue("qr_code", res[0].ufsUrl, {
                        shouldDirty: true,
                        shouldTouch: true,
                      })
                      toast.success("QR code uploaded successfully")
                    }
                  }}
                  onUploadError={(error: Error) => {
                    toast.error(`Upload failed: ${error.message}`)
                  }}
                  appearance={{
                    button:
                      "whitespace-nowrap text-primary-foreground px-8 mt-4 focus-within:ring-primary/90 data-[state=disabled]:bg-primary/70 data-[state=ready]:bg-primary/90 data-[state=readying]:bg-primary/70 data-[state=uploading]:bg-primary/70 data-[state=uploading]:after:bg-primary/90",
                    container: "w-full bg-muted/50 p-2 rounded-lg",
                    allowedContent: "text-xs text-muted-foreground",
                  }}
                />
              </div>

              <Button type="submit" isLoading={updateMutation.isPending} className="min-w-32 max-md:w-full">
                Update Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="xl:w-1/2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Vendor Profile</CardTitle>
        <Button onClick={() => setIsEditing(true)}>
          <Icons.Edit />
          Edit Profile
        </Button>
      </CardHeader>
      <CardDescription className="hidden" />
      <CardContent className="bg-background overflow-hidden rounded-b-lg border-y p-0">
        <Table>
          <TableBody>
            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
              <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Name</TableCell>
              <TableCell className="w-2/3 py-2">{vendor.name}</TableCell>
            </TableRow>
            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
              <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Organisation Name</TableCell>
              <TableCell className="w-2/3 py-2">{vendor.org_name}</TableCell>
            </TableRow>
            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
              <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Phone</TableCell>
              <TableCell className="w-2/3 py-2">{vendor.phone}</TableCell>
            </TableRow>
            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
              <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Address</TableCell>
              <TableCell className="w-2/3 py-2">{vendor.address}</TableCell>
            </TableRow>
            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
              <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Status</TableCell>
              <TableCell className="w-2/3 py-2">{vendor.is_active ? "Active" : "Inactive"}</TableCell>
            </TableRow>
            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
              <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Service Areas</TableCell>
              <TableCell className="w-2/3 py-2">{vendor.service_area?.join(", ") || ""}</TableCell>
            </TableRow>
            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
              <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Joined On</TableCell>
              <TableCell className="w-2/3 py-2">{dayjs(vendor.created_at).format("DD-MM-YYYY") || "N/A"}</TableCell>
            </TableRow>
            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
              <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">UPI ID</TableCell>
              <TableCell className="w-2/3 py-2">{vendor.upi_id || "N/A"}</TableCell>
            </TableRow>
            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
              <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">QR Code</TableCell>
              <TableCell className="w-2/3 py-2">
                {vendor.qr_code ? (
                  <img src={vendor.qr_code} width={100} height={100} alt="QR Code" className="h-24 w-24 rounded-lg" />
                ) : (
                  "N/A"
                )}
              </TableCell>
            </TableRow>
            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
              <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Logo</TableCell>
              <TableCell className="w-2/3 py-2">
                {vendor.logo_url ? (
                  <img src={vendor.logo_url} width={100} height={100} alt="Logo" className="h-24 w-24 rounded-lg" />
                ) : (
                  "N/A"
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
