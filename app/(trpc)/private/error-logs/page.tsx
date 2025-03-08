"use client"

import dayjs from "dayjs"
import { parseAsInteger, useQueryState } from "nuqs"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { clientApi } from "@/components/trpc-provider"

export default function ErrorLogsPage() {
  const [errorId, setErrorId] = useQueryState("errorId", parseAsInteger.withDefault(0))
  const { data: logs, isLoading } = clientApi.log.getAllErrorLogs.useQuery()
  const { data: singleLog } = clientApi.log.getErrorLogById.useQuery({ id: errorId }, { enabled: !!errorId })

  if (isLoading) return <div className="flex h-48 items-center justify-center">Loading...</div>
  if (!logs || !logs.data || !logs?.success) return <div className="flex h-48 items-center justify-center">No logs found</div>

  return (
    <div className="mx-4 py-10 md:mx-auto md:max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Error Logs</h1>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.data.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{dayjs(log.created_at).format("HH:mm:ss")}</TableCell>
              <TableCell>{log.error_message}</TableCell>
              <TableCell className="font-mono text-sm">
                {log.error_message.slice(0, 50)}
                {log.error_message.length > 50 && "..."}
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => setErrorId(log.id)}>
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!errorId} onOpenChange={() => setErrorId(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Error Log Details</DialogTitle>
          </DialogHeader>
          {singleLog?.success && singleLog.data ? (
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="font-semibold">Severity:</h3>
                  {singleLog.data.severity}
                </div>
                <h3 className="font-semibold">Message:</h3>
                <p className="bg-secondary/50 mt-2 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                  {singleLog.data.error_message}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Stack Trace:</h3>
                <pre className="bg-secondary/50 max-h-[400px] overflow-auto rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                  {singleLog.data.error_stack}
                </pre>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Timestamp:</h3>
                <p className="font-mono">{dayjs(singleLog.data.created_at).format("PPpp")}</p>
              </div>
            </div>
          ) : (
            <p>Log not found</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
