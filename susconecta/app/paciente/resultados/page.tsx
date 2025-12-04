import React, { Suspense } from 'react'
import ResultadosClient from './ResultadosClient'

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span>Carregando...</span></div>}>
      <ResultadosClient />
    </Suspense>
  )
}
