// Tipo de erro padrão para respostas de API
export interface ApiError {
	message: string;
	code?: string;
}
// Este arquivo foi renomeado de report.ts para report-types.ts para evitar confusão com outros arquivos de lógica.
// Tipos para o endpoint Supabase de Relatórios Médicos
export interface Report {
	id: string;
	patient_id: string;
	order_number: string;
	exam: string;
	diagnosis: string;
	conclusion: string;
	cid_code: string;
	content_html: string;
	content_json: any;
	status: string;
	requested_by: string;
	due_at: string;
	hide_date: boolean;
	hide_signature: boolean;
	created_at: string;
	updated_at: string;
	created_by: string;
}

export interface CreateReportData {
	patient_id: string;
		order_number: string;
	exam: string;
	diagnosis: string;
	conclusion: string;
	cid_code: string;
	content_html: string;
	content_json: any;
		status: string;
	requested_by: string;
	due_at: string;
		hide_date: boolean;
		hide_signature: boolean;
	created_by: string;
}

export interface UpdateReportData extends Partial<CreateReportData> {
	updated_at?: string;
}

export type ReportsResponse = Report[];
export type ReportResponse = Report;

// Dados para criar um novo relatório
export interface CreateReportData {
		patient_id: string;
		order_number: string;
		exam: string;
		diagnosis: string;
		conclusion: string;
		cid_code: string;
		content_html: string;
		content_json: any;
		status: string;
		requested_by: string;
		due_at: string;
		hide_date: boolean;
		hide_signature: boolean;
}

// Dados para atualizar um relatório existente
export interface UpdateReportData extends Partial<CreateReportData> {
	updated_at?: string;
}

// Resposta da API ao listar relatórios

// Dados do formulário (adaptado para a estrutura do front-end existente)
export interface ReportFormData {
	// Identificação do Profissional
	profissionalNome: string;
	profissionalCrm: string;
  
	// Identificação do Paciente  
	patient_id: string;
	report_type: string;
	symptoms_and_signs: string;
	diagnosis: string;
	prognosis?: string;
	treatment_performed: string;
	icd_code?: string;
	report_date: string;
	hipotesesDiagnosticas: string;
	condutaMedica: string;
	prescricoes: string;
	retornoAgendado: string;
		// cid10: string; // Removed, not present in schema
  
	
}