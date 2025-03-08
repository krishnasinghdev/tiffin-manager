import dayjs from "dayjs"
import jsPDF from "jspdf"
import autoTable, { RowInput } from "jspdf-autotable"

import type { BillDetails } from "@/types/zod"

type TableConfig = {
  head: string[][]
  body: RowInput[]
  startY?: number
  styles?: object
}

type BillData = {
  id: number
  customer_name: string
  bill_date: string
  due_date: string
  bill_details: BillDetails
  payments: { amount: string; payment_date: string; id: number; payment_mode: "cash" | "online" }[] | null
  total_amount: string
  remaining_amount: string
  payment_status: "unpaid" | "partial_paid" | "paid" | "advance"
  amount_paid: string
  upi_id: string
  qr_code: string
  org_name: string
  logo_url: string
}

type AttendanceData = {
  customer_name: string
  month: string
  year: string
  details: {
    date: string
    breakfast: string
    lunch: string
    dinner: string
    custom: string | null
  }[]
  logo_url?: string
}

export type jsPDFExtra = jsPDF & {
  lastAutoTable: { finalY: number }
}

type Alignment = "left" | "center" | "right"

type ImageOptions = {
  url: string
  x: number
  y: number
  width: number
  height: number
  format?: string
}

export class PDFGenerator {
  private doc: jsPDFExtra
  private currentY: number = 10
  private readonly images = {
    logo: "https://iwy3nw3cjp.ufs.sh/f/BhRS1aHM3KDSkKQChxoB5KcLR4owYxjWpsbD8F1nrJVhqfi6",
    unpaid: "https://iwy3nw3cjp.ufs.sh/f/BhRS1aHM3KDSkKQChxoB5KcLR4owYxjWpsbD8F1nrJVhqfi6",
    partial_paid: "https://iwy3nw3cjp.ufs.sh/f/BhRS1aHM3KDSkKQChxoB5KcLR4owYxjWpsbD8F1nrJVhqfi6",
    paid: "https://iwy3nw3cjp.ufs.sh/f/BhRS1aHM3KDSkKQChxoB5KcLR4owYxjWpsbD8F1nrJVhqfi6",
    advance: "https://iwy3nw3cjp.ufs.sh/f/BhRS1aHM3KDSkKQChxoB5KcLR4owYxjWpsbD8F1nrJVhqfi6",
  }

  private readonly colors = {
    primary: [249, 115, 22] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    black: [0, 0, 0] as [number, number, number],
  }

  private readonly defaultStyles = {
    headStyles: { fillColor: this.colors.primary as [number, number, number] },
    theme: "grid" as const,
  }

  constructor() {
    this.doc = new jsPDF({ putOnlyUsedFonts: true, compress: true }) as jsPDFExtra
    this.initializeDocument()
  }

  private initializeDocument(): void {
    // this.doc.addFileToVFS("roboto.ttf", ROBOTO_FONT)
    // this.doc.addFont("roboto.ttf", "roboto", "normal")
    // this.doc.setFont("roboto")
    this.doc.setFont("helvetica")
  }

  private resetDocument(): void {
    this.doc = new jsPDF({ putOnlyUsedFonts: true, compress: true }) as jsPDFExtra
    this.currentY = 10
    this.initializeDocument()
  }

  private addImage(options: ImageOptions): void {
    const { url, x, y, width, height, format = "PNG" } = options
    this.doc.addImage(url, format, x, y, width, height)
  }

  private addPoweredByLogo(): void {
    const pageHeight = this.doc.internal.pageSize.getHeight()

    this.addImage({
      url: this.images.logo,
      x: 10,
      y: pageHeight - 25,
      width: 20,
      height: 20,
    })
  }

  private addPaymentStamp(status: BillData["payment_status"]): void {
    const pageWidth = this.doc.internal.pageSize.getWidth()
    const stampImage = this.images[status]
    if (stampImage) {
      this.addImage({
        url: stampImage,
        x: pageWidth - 60,
        y: 30,
        width: 50,
        height: 25,
      })
    }
  }

  private addQRCode(qrCodeUrl: string): void {
    const pageWidth = this.doc.internal.pageSize.getWidth()
    const pageHeight = this.doc.internal.pageSize.getHeight()
    this.addImage({
      url: qrCodeUrl,
      x: pageWidth - 60,
      y: pageHeight - 60,
      width: 50,
      height: 50,
    })
  }

  private addHR(): void {
    this.doc.setLineWidth(0.2)
    this.doc.line(10, this.currentY, this.doc.internal.pageSize.getWidth() - 10, this.currentY)
    this.currentY += 5
  }

  private addHeader(title: string, data: Record<string, string> & { logo_url?: string }): void {
    const margin = 10
    const logoWidth = 30
    const logoHeight = 30
    const textLeftMargin = margin
    const pageWidth = this.doc.internal.pageSize.getWidth()
    const textRightLimit = pageWidth - logoWidth - margin * 2

    const startY = this.currentY

    if (data.logo_url) {
      this.addImage({
        url: data.logo_url,
        x: pageWidth - logoWidth - margin,
        y: startY,
        width: logoWidth,
        height: logoHeight,
      })
    }

    this.doc.setFontSize(16)
    this.doc.text(title, textLeftMargin, startY + 5, { align: "left", maxWidth: textRightLimit - textLeftMargin })
    this.currentY = startY + 8
    this.doc.setFontSize(12)
    let textY = this.currentY + 5

    Object.entries(data).forEach(([key, value]) => {
      if (key !== "logo_url") {
        this.doc.text(`${key}: ${value}`, textLeftMargin, textY, { align: "left", maxWidth: textRightLimit - textLeftMargin })
        textY += 5
      }
    })

    const logoBottom = data.logo_url ? startY + logoHeight : 0
    this.currentY = Math.max(textY, logoBottom, startY + 30)
  }

  public addLinkButton(text: string, url: string, alignment: Alignment = "left"): void {
    const pageWidth = this.doc.internal.pageSize.getWidth()
    const textWidth = this.doc.getTextWidth(text)
    const buttonPadding = 5
    const buttonHeight = 10

    let x: number
    switch (alignment) {
      case "center":
        x = (pageWidth - textWidth - buttonPadding * 2) / 2
        break
      case "right":
        x = pageWidth - textWidth - buttonPadding * 2 - 10
        break
      case "left":
      default:
        x = 10
    }

    this.doc.setFillColor(...this.colors.primary)
    this.doc.rect(x, this.currentY, textWidth + buttonPadding * 2, buttonHeight, "F")

    this.doc.setTextColor(...this.colors.white)
    const linkX = x + buttonPadding
    const linkY = this.currentY + 7
    this.doc.textWithLink(text, linkX, linkY, { url })

    this.doc.setDrawColor(0, 0, 0, 0)
    this.doc.setFillColor(0, 0, 0, 0)
    this.doc.rect(x, this.currentY, textWidth + buttonPadding * 2, buttonHeight)
    this.doc.link(x, this.currentY, textWidth + buttonPadding * 2, buttonHeight, { url })

    this.doc.setTextColor(...this.colors.black)
    this.currentY += buttonHeight + 5
  }

  private createTable(config: TableConfig): void {
    autoTable(this.doc, {
      ...config,
      ...this.defaultStyles,
      ...config.styles,
      startY: this.currentY,
      didDrawPage: (data) => {
        this.currentY = (data.table.finalY || 0) + 10
      },
    })
    this.currentY = this.doc.lastAutoTable.finalY + 10
  }

  public async generateBillPDF(data: BillData): Promise<jsPDFExtra> {
    return new Promise((resolve, reject) => {
      try {
        this.resetDocument()
        this.addHeader("Bill Summary", {
          "Bill ID": data.id.toString(),
          "Customer Name": data.customer_name,
          "Bill Date": data.bill_date,
          "Due Date": data.due_date,
          logo_url: data.logo_url || "",
        })
        // this.addPaymentStamp(data.payment_status)
        this.addHR()

        const amountBody = [
          ["Total Amount", `Rs. ${data.total_amount}`],
          ["Amount Paid", `Rs. ${data.amount_paid}`],
          ["Remaining Amount", `Rs. ${data.remaining_amount}`],
        ]

        if ("counts" in data.bill_details && data.bill_details.counts) {
          // Handle counts-based bill details
          amountBody.push(
            ["Price Per Tiffin", `Rs. ${data.bill_details.price_per_tiffin || 0}`],
            ["Custom Delivery Amount", `Rs. ${data.bill_details.addon_amount || 0}`]
          )
          const deliveryBody = Object.entries(data.bill_details.counts)
            .filter(([, count]) => count > 0)
            .map(([type, count]) => [type.charAt(0).toUpperCase() + type.slice(1), count.toString()])

          if (data.bill_details.total_tiffins) {
            deliveryBody.push(["Total Tiffins", data.bill_details.total_tiffins.toString()])
          }

          if (deliveryBody.length > 0) {
            this.createTable({
              head: [["Delivery Type", "Count"]],
              body: deliveryBody,
            })
          }
        } else if ("items" in data.bill_details && data.bill_details.items) {
          // Handle itemized bill details
          const itemsBody = data.bill_details.items.map((item) => [
            item.name || "Item",
            item.quantity?.toString() || "1",
            `Rs. ${item.price || 0}`,
          ])

          if (itemsBody.length > 0) {
            this.createTable({
              head: [["Item", "Quantity", "Price", "Total"]],
              body: itemsBody,
            })
          }
        }

        this.createTable({
          head: [["Amount Details", "Value"]],
          body: amountBody,
        })

        this.createTable({
          head: [["Payment Details", "Status"]],
          body: [
            ["Payment Status", data.payment_status.charAt(0).toUpperCase() + data.payment_status.slice(1)],
            ["UPI ID", data.upi_id || "Not available"],
          ],
        })

        if (data.payments && data.payments.length > 0) {
          const paymentsBody = data.payments.map((payment) => [
            dayjs(payment.payment_date).format("DD MMM, YY"),
            payment.payment_mode.charAt(0).toUpperCase() + payment.payment_mode.slice(1),
            `Rs. ${payment.amount}`,
          ])

          this.createTable({
            head: [["Payment Date", "Payment Mode", "Amount"]],
            body: paymentsBody,
          })
        }

        if (data.payment_status !== "paid" && data.upi_id) {
          const payment_url = `upi://pay?pa=${encodeURIComponent(data.upi_id)}&pn=${encodeURIComponent(data.org_name)}&cu=INR&am=${encodeURIComponent(data.remaining_amount)}&tn=${encodeURIComponent("Tiffin Bill Payment")}`
          this.addLinkButton("Pay Now", payment_url, "center")
          if (data.qr_code) {
            this.addQRCode(data.qr_code)
          }
        }
        this.addPoweredByLogo()

        resolve(this.doc)
      } catch (error) {
        reject(error)
      }
    })
  }

  public async generateAttendancePDF(data: AttendanceData): Promise<jsPDFExtra> {
    return new Promise((resolve, reject) => {
      try {
        this.resetDocument()
        this.addHeader(`Delivery Summary | ${data.month}, ${data.year}`, {
          "Customer Name": data.customer_name,
          logo_url: data.logo_url || "",
        })
        this.addHR()
        function getDeliveryValue(value: string): string {
          switch (value) {
            case "P":
              return "Yes"
            case "A":
              return "x"
            case "H":
              return "Holiday"
            default:
              return "-"
          }
        }
        const attendanceRows = data.details.map((day) => {
          return [
            day.date,
            // getDeliveryValue(day.breakfast),
            getDeliveryValue(day.lunch),
            getDeliveryValue(day.dinner),
            day.custom || "-",
          ]
        })

        const summary = data.details.reduce(
          (acc, day) => {
            if (day.lunch === "P") acc.lunch++
            if (day.dinner === "p") acc.dinner++
            if (day.custom === "P") acc.custom++
            return acc
          },
          { lunch: 0, dinner: 0, custom: 0 }
        )

        this.createTable({
          startY: this.currentY + 10,
          head: [["Date", "Lunch", "Dinner", "Custom Delivery"]],
          body: attendanceRows,
        })

        this.createTable({
          startY: this.doc.lastAutoTable.finalY + 10,
          head: [["Summary", "Count"]],
          body: [
            ["Total Lunch", summary.lunch.toString()],
            ["Total Dinner", summary.dinner.toString()],
            ["Total Custom Deliveries", summary.custom.toString()],
          ],
        })

        this.addPoweredByLogo()
        resolve(this.doc)
      } catch (error) {
        reject(error)
      }
    })
  }
}
