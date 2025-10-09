// Tipo de erro padrão para respostas de API
export interface ApiError {
	message: string;
	code?: string;
}
// Este arquivo foi renomeado de report.ts para report-types.ts para evitar confusão com outros arquivos de lógica.
// Tipos para o endpoint de Relatórios Médicos
export interface Report {
	id: string;
	patient_id: string;
	doctor_id: string;
	report_type: string;
	chief_complaint: string;
	clinical_history: string;
	symptoms_and_signs: string;
	physical_examination: string;
	complementary_exams: string;
	exam_results: string;
	diagnosis: string;
	prognosis?: string;
	treatment_performed: string;
	objective_recommendations: string;
	icd_code?: string;
	report_date: string;
	created_at: string;
	updated_at: string;
  
	// Dados expandidos (quando incluir dados relacionados)
	patient?: {
		id: string;
		full_name: string;
		cpf?: string;
		birth_date?: string;
	};
  
	doctor?: {
		id: string;
		full_name: string;
		crm?: string;
		specialty?: string;
	};
}

// Dados para criar um novo relatório
export interface CreateReportData {
	patient_id: string;
	doctor_id: string;
	report_type: string;
	chief_complaint: string;
	clinical_history: string;
	symptoms_and_signs: string;
	physical_examination: string;
	complementary_exams: string;
	exam_results: string;
	diagnosis: string;
	prognosis?: string;
	treatment_performed: string;
	objective_recommendations: string;
	icd_code?: string;
	report_date: string;
}

// Dados para atualizar um relatório existente
export interface UpdateReportData extends Partial<CreateReportData> {
	updated_at?: string;
}

// Resposta da API ao listar relatórios
export interface ReportsResponse {
	data: Report[];
	success: boolean;
	message?: string;
}

// Resposta da API ao criar/atualizar um relatório
export interface ReportResponse {
	data: Report;
	success: boolean;
	message?: string;
}

// Dados do formulário (adaptado para a estrutura do front-end existente)
export interface ReportFormData {
	// Identificação do Profissional
	profissionalNome: string;
	profissionalCrm: string;
  
	// Identificação do Paciente  
	pacienteId: string;
	pacienteNome: string;
	pacienteCpf: string;
	pacienteIdade: string;
  
	// Informações do Relatório
	motivoRelatorio: string;
	cid?: string;
	dataRelatorio: string;
  
	// Histórico Clínico
	historicoClinico: string;
  
	// Sinais, Sintomas e Exames
	sinaisSintomas: string;
	examesRealizados: string;
	resultadosExames: string;
	// ...restante do código...

