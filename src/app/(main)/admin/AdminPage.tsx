'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Calendar, Trophy, Loader2, AlertCircle } from "lucide-react"
import { useCurrentUser } from "@/lib/hooks"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EventTimingManager } from "./EventTimingManager"
import { BoutResultManager } from "./BoutResultManager"

export function AdminPage() {
  const router = useRouter()
  const { data: user, isLoading } = useCurrentUser()
  const [activeTab, setActiveTab] = useState("events")

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-7xl py-6 px-4 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Not logged in
  if (!user) {
    router.push("/auth")
    return null
  }

  // Not admin
  if (!user.is_admin) {
    return (
      <div className="container max-w-4xl py-6 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos de administrador para acceder a esta página.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl py-6 px-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      {/* Admin Info Card */}
      <Card className="card-gradient p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">Administrador</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events" className="gap-2">
            <Calendar className="h-4 w-4" />
            Gestionar Eventos
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2">
            <Trophy className="h-4 w-4" />
            Registrar Resultados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <EventTimingManager />
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <BoutResultManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
