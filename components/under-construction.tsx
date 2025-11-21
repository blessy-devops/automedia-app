import Link from "next/link"
import { Construction } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface UnderConstructionProps {
  featureName: string
  description?: string
}

export function UnderConstruction({ featureName, description }: UnderConstructionProps) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Construction className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl">Em Construção</CardTitle>
            <CardDescription className="text-base">
              {featureName}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            {description || "Esta funcionalidade está sendo desenvolvida e estará disponível em breve."}
          </p>
          <Button asChild className="w-full">
            <Link href="/dashboard">
              Voltar ao Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
