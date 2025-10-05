export default function DashboardPage() {
  return (
    <>
      <div className="space-y-6 p-6 bg-background">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao painel de controle
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total de Pacientes
            </h3>
            <p className="text-2xl font-bold text-foreground">1,234</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground">
              Consultas Hoje
            </h3>
            <p className="text-2xl font-bold text-foreground">28</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground">
              Próximas Consultas
            </h3>
            <p className="text-2xl font-bold text-foreground">45</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground">
              Receita Mensal
            </h3>
            <p className="text-2xl font-bold text-foreground">R$ 45.230</p>
          </div>
        </div>
      </div>
    </>
  );
}
