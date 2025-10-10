# Listar atribuições de pacientes

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /rest/v1/patient_assignments:
    get:
      summary: Listar atribuições de pacientes
      deprecated: false
      description: ''
      tags:
        - Atribuições
        - Atribuições
      parameters:
        - name: apikey
          in: header
          description: Chave da API Supabase
          required: true
          example: ''
          schema:
            type: string
      responses:
        '200':
          description: Lista de atribuições
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/PatientAssignment'
          headers: {}
          x-apidog-name: OK
      security:
        - bearer: []
      x-apidog-folder: Atribuições
      x-apidog-status: released
      x-run-in-apidog: https://app.apidog.com/web/project/1053378/apis/api-21940525-run
components:
  schemas:
    PatientAssignment:
      type: object
      properties:
        id:
          type: string
          format: uuid
          examples:
            - 12345678-1234-1234-1234-123456789012
        patient_id:
          type: string
          format: uuid
          examples:
            - 12345678-1234-1234-1234-123456789012
        user_id:
          type: string
          format: uuid
          examples:
            - 12345678-1234-1234-1234-123456789012
        role:
          type: string
          enum:
            - medico
            - enfermeiro
          examples:
            - medico
        created_at:
          type: string
          format: date-time
          examples:
            - '2024-01-15T10:30:00Z'
        created_by:
          type: string
          format: uuid
          examples:
            - 12345678-1234-1234-1234-123456789012
      x-apidog-orders:
        - id
        - patient_id
        - user_id
        - role
        - created_at
        - created_by
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
  securitySchemes:
    bearerAuth:
      type: jwt
      scheme: bearer
      bearerFormat: JWT
      description: Token JWT obtido no login
    bearer:
      type: http
      scheme: bearer
servers:
  - url: https://yuanqfswhberkoevtmfr.supabase.co
    description: Prod Env
  - url: ''
    description: Cloud Mock
security:
  - bearer: []

```

# Criar nova atribuição

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /rest/v1/patient_assignments:
    post:
      summary: Criar nova atribuição
      deprecated: false
      description: ''
      tags:
        - Atribuições
        - Atribuições
      parameters:
        - name: apikey
          in: header
          description: Chave da API Supabase
          required: true
          example: ''
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PatientAssignmentInput'
      responses:
        '201':
          description: Atribuição criada
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PatientAssignment'
          headers: {}
          x-apidog-name: Created
      security:
        - bearer: []
      x-apidog-folder: Atribuições
      x-apidog-status: released
      x-run-in-apidog: https://app.apidog.com/web/project/1053378/apis/api-21940526-run
components:
  schemas:
    PatientAssignmentInput:
      type: object
      required:
        - patient_id
        - user_id
        - role
      properties:
        patient_id:
          type: string
          format: uuid
        user_id:
          type: string
          format: uuid
        role:
          type: string
          enum:
            - medico
            - enfermeiro
      x-apidog-orders:
        - patient_id
        - user_id
        - role
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
    PatientAssignment:
      type: object
      properties:
        id:
          type: string
          format: uuid
          examples:
            - 12345678-1234-1234-1234-123456789012
        patient_id:
          type: string
          format: uuid
          examples:
            - 12345678-1234-1234-1234-123456789012
        user_id:
          type: string
          format: uuid
          examples:
            - 12345678-1234-1234-1234-123456789012
        role:
          type: string
          enum:
            - medico
            - enfermeiro
          examples:
            - medico
        created_at:
          type: string
          format: date-time
          examples:
            - '2024-01-15T10:30:00Z'
        created_by:
          type: string
          format: uuid
          examples:
            - 12345678-1234-1234-1234-123456789012
      x-apidog-orders:
        - id
        - patient_id
        - user_id
        - role
        - created_at
        - created_by
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
  securitySchemes:
    bearerAuth:
      type: jwt
      scheme: bearer
      bearerFormat: JWT
      description: Token JWT obtido no login
    bearer:
      type: http
      scheme: bearer
servers:
  - url: https://yuanqfswhberkoevtmfr.supabase.co
    description: Prod Env
  - url: ''
    description: Cloud Mock
security:
  - bearer: []

```

# Listar roles de usuários

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /rest/v1/user_roles:
    get:
      summary: Listar roles de usuários
      deprecated: false
      description: ''
      tags:
        - Usuários
        - Usuários
      parameters: []
      responses:
        '200':
          description: Lista de roles
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/UserRole'
          headers: {}
          x-apidog-name: OK
      security:
        - bearer: []
      x-apidog-folder: Usuários
      x-apidog-status: released
      x-run-in-apidog: https://app.apidog.com/web/project/1053378/apis/api-21940524-run
components:
  schemas:
    UserRole:
      type: object
      properties:
        id:
          type: string
          format: uuid
          examples:
            - 12345678-1234-1234-1234-123456789012
        user_id:
          type: string
          format: uuid
          examples:
            - 12345678-1234-1234-1234-123456789012
        role:
          type: string
          enum:
            - admin
            - gestor
            - medico
          examples:
            - medico
        created_at:
          type: string
          format: date-time
          examples:
            - '2024-01-15T10:30:00Z'
      x-apidog-orders:
        - id
        - user_id
        - role
        - created_at
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
  securitySchemes:
    bearerAuth:
      type: jwt
      scheme: bearer
      bearerFormat: JWT
      description: Token JWT obtido no login
    bearer:
      type: http
      scheme: bearer
servers:
  - url: https://yuanqfswhberkoevtmfr.supabase.co
    description: Prod Env
  - url: ''
    description: Cloud Mock
security:
  - bearer: []

```

# Obter informações completas do usuário

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /functions/v1/user-info:
    get:
      summary: Obter informações completas do usuário
      deprecated: false
      description: >-
        Retorna dados consolidados do usuário autenticado, incluindo perfil e
        roles para controle de permissões.
      tags:
        - Usuários
      parameters: []
      responses:
        '200':
          description: Informações do usuário retornadas com sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserInfoResponse'
          headers: {}
          x-apidog-name: OK
        '401':
          description: Token inválido ou expirado
          content:
            application/json:
              schema: &ref_0
                $ref: '#/components/schemas/Error'
          headers: {}
          x-apidog-name: Unauthorized
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema: *ref_0
          headers: {}
          x-apidog-name: Internal Server Error
      security: []
      x-apidog-folder: Usuários
      x-apidog-status: released
      x-run-in-apidog: https://app.apidog.com/web/project/1053378/apis/api-21952675-run
components:
  schemas:
    UserInfoResponse:
      type: object
      properties:
        user:
          $ref: '#/components/schemas/User'
        profile:
          $ref: '#/components/schemas/Profile'
        roles:
          type: array
          items:
            type: string
            enum:
              - admin
              - gestor
              - medico
              - secretaria
              - user
          examples:
            - - medico
              - admin
        permissions:
          $ref: '#/components/schemas/Permissions'
      x-apidog-orders:
        - user
        - profile
        - roles
        - permissions
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
    Permissions:
      type: object
      properties:
        isAdmin:
          type: boolean
          description: Se o usuário tem role de admin
          examples:
            - true
        isManager:
          type: boolean
          description: Se o usuário tem role de gestor
          examples:
            - false
        isDoctor:
          type: boolean
          description: Se o usuário tem role de médico
          examples:
            - true
        isSecretary:
          type: boolean
          description: Se o usuário tem role de secretária
          examples:
            - false
        isAdminOrManager:
          type: boolean
          description: Se o usuário é admin ou gestor (para controle de permissões)
          examples:
            - true
      x-apidog-orders:
        - isAdmin
        - isManager
        - isDoctor
        - isSecretary
        - isAdminOrManager
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
    Profile:
      type: object
      properties:
        id:
          type: string
          format: uuid
        full_name:
          type: string
          examples:
            - Dr. João Silva
          nullable: true
        email:
          type: string
          format: email
          nullable: true
        phone:
          type: string
          examples:
            - '+5511999999999'
          nullable: true
        avatar_url:
          type: string
          format: uri
          nullable: true
        disabled:
          type: boolean
          examples:
            - false
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
      x-apidog-orders:
        - id
        - full_name
        - email
        - phone
        - avatar_url
        - disabled
        - created_at
        - updated_at
      x-apidog-ignore-properties: []
      nullable: true
      x-apidog-folder: ''
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
          examples:
            - 550e8400-e29b-41d4-a716-446655440000
        email:
          type: string
          format: email
          examples:
            - usuario@exemplo.com
        email_confirmed_at:
          type: string
          format: date-time
          examples:
            - '2024-01-01T10:00:00Z'
          nullable: true
        created_at:
          type: string
          format: date-time
          examples:
            - '2024-01-01T00:00:00Z'
        last_sign_in_at:
          type: string
          format: date-time
          examples:
            - '2024-01-15T09:30:00Z'
          nullable: true
      x-apidog-orders:
        - id
        - email
        - email_confirmed_at
        - created_at
        - last_sign_in_at
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
    Error:
      type: object
      properties:
        error:
          type: string
        message:
          type: string
        code:
          type: string
      x-apidog-orders:
        - error
        - message
        - code
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
  securitySchemes:
    bearerAuth:
      type: jwt
      scheme: bearer
      bearerFormat: JWT
      description: Token JWT obtido no login
    bearer:
      type: http
      scheme: bearer
servers:
  - url: https://yuanqfswhberkoevtmfr.supabase.co
    description: Prod Env
  - url: ''
    description: Cloud Mock
security:
  - bearer: []

```

# Criar novo usuário

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /functions/v1/create-user:
    post:
      summary: Criar novo usuário
      deprecated: false
      description: >-
        Cria um novo usuário no sistema com papel específico. Apenas usuários
        com papel de admin, gestor ou secretaria podem criar novos usuários.
      operationId: createUser
      tags:
        - Usuários
        - Usuários
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
            examples:
              admin_user:
                value:
                  email: admin@mediconnect.com
                  password: senha123!
                  full_name: João Silva
                  phone: (11) 99999-9999
                  role: admin
                summary: Criar administrador
              doctor_user:
                value:
                  email: dr.maria@mediconnect.com
                  password: senha123!
                  full_name: Dra. Maria Santos
                  phone: (11) 98888-8888
                  role: medico
                summary: Criar médico
              secretary_user:
                value:
                  email: secretaria@mediconnect.com
                  password: senha123!
                  full_name: Ana Costa
                  phone: (11) 97777-7777
                  role: secretaria
                summary: Criar secretária
      responses:
        '200':
          description: Usuário criado com sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CreateUserResponse'
              example:
                success: true
                user:
                  id: 123e4567-e89b-12d3-a456-426614174000
                  email: novo.usuario@mediconnect.com
                  full_name: Novo Usuário
                  phone: (11) 99999-9999
                  role: medico
          headers: {}
          x-apidog-name: OK
        '400':
          description: Dados inválidos ou erro de validação
          content:
            application/json:
              schema:
                type: object
                properties: {}
                x-apidog-ignore-properties: []
                x-apidog-orders: []
              examples:
                '2':
                  summary: Campos obrigatórios faltando
                  value:
                    error: 'Missing required fields: email, password, full_name, role'
                '3':
                  summary: Papel inválido
                  value:
                    error: Invalid role
                '4':
                  summary: Email já existe
                  value:
                    error: User with this email already registered
          headers: {}
          x-apidog-name: Bad Request
        '401':
          description: Token de autenticação inválido ou ausente
          content:
            application/json:
              schema:
                type: object
                properties: {}
                x-apidog-ignore-properties: []
                x-apidog-orders: []
              example:
                error: Unauthorized
          headers: {}
          x-apidog-name: Unauthorized
        '403':
          description: Permissões insuficientes
          content:
            application/json:
              schema:
                type: object
                properties: {}
                x-apidog-ignore-properties: []
                x-apidog-orders: []
              example:
                error: Insufficient permissions
          headers: {}
          x-apidog-name: Forbidden
        '500':
          description: Erro interno do servidor
          content:
            application/json:
              schema:
                type: object
                properties: {}
                x-apidog-ignore-properties: []
                x-apidog-orders: []
              example:
                error: Internal server error
          headers: {}
          x-apidog-name: Internal Server Error
      security: []
      x-apidog-folder: Usuários
      x-apidog-status: released
      x-run-in-apidog: https://app.apidog.com/web/project/1053378/apis/api-21953135-run
components:
  schemas:
    CreateUserRequest:
      type: object
      required:
        - email
        - password
        - full_name
        - role
      properties:
        email:
          type: string
          format: email
          description: Email do usuário (deve ser único)
          examples:
            - usuario@mediconnect.com
        password:
          type: string
          minLength: 6
          description: Senha temporária para o usuário
          examples:
            - senha123!
        full_name:
          type: string
          minLength: 1
          description: Nome completo do usuário
          examples:
            - João da Silva
        phone:
          type: string
          description: Telefone do usuário (opcional)
          examples:
            - (11) 99999-9999
          nullable: true
        role:
          type: string
          enum:
            - admin
            - gestor
            - medico
            - secretaria
            - user
          description: Papel do usuário no sistema
          examples:
            - medico
      x-apidog-orders:
        - email
        - password
        - full_name
        - phone
        - role
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
    CreateUserResponse:
      type: object
      properties:
        success:
          type: boolean
          description: Indica se a operação foi bem-sucedida
          examples:
            - true
        user:
          type: object
          properties:
            id:
              type: string
              format: uuid
              description: ID único do usuário criado
              examples:
                - 123e4567-e89b-12d3-a456-426614174000
            email:
              type: string
              format: email
              description: Email do usuário
              examples:
                - usuario@mediconnect.com
            full_name:
              type: string
              description: Nome completo do usuário
              examples:
                - João da Silva
            phone:
              type: string
              description: Telefone do usuário
              examples:
                - (11) 99999-9999
              nullable: true
            role:
              type: string
              description: Papel atribuído ao usuário
              examples:
                - medico
          x-apidog-orders:
            - id
            - email
            - full_name
            - phone
            - role
          x-apidog-ignore-properties: []
      x-apidog-orders:
        - success
        - user
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
  securitySchemes:
    bearerAuth:
      type: jwt
      scheme: bearer
      bearerFormat: JWT
      description: Token JWT obtido no login
    bearer:
      type: http
      scheme: bearer
servers:
  - url: https://yuanqfswhberkoevtmfr.supabase.co
    description: Prod Env
  - url: ''
    description: Cloud Mock
security:
  - bearer: []

```

# Obter dados do usuário atual

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /auth/v1/user:
    get:
      summary: Obter dados do usuário atual
      deprecated: false
      description: Retorna informações do usuário autenticado
      tags:
        - Usuários
        - Authentication
      parameters: []
      responses:
        '200':
          description: Dados do usuário
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
          headers: {}
          x-apidog-name: OK
        '401':
          description: Token inválido
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
          headers: {}
          x-apidog-name: Unauthorized
      security:
        - bearer: []
      x-apidog-folder: Usuários
      x-apidog-status: released
      x-run-in-apidog: https://app.apidog.com/web/project/1053378/apis/api-21940512-run
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
          examples:
            - 550e8400-e29b-41d4-a716-446655440000
        email:
          type: string
          format: email
          examples:
            - usuario@exemplo.com
        email_confirmed_at:
          type: string
          format: date-time
          examples:
            - '2024-01-01T10:00:00Z'
          nullable: true
        created_at:
          type: string
          format: date-time
          examples:
            - '2024-01-01T00:00:00Z'
        last_sign_in_at:
          type: string
          format: date-time
          examples:
            - '2024-01-15T09:30:00Z'
          nullable: true
      x-apidog-orders:
        - id
        - email
        - email_confirmed_at
        - created_at
        - last_sign_in_at
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
    Error:
      type: object
      properties:
        error:
          type: string
        message:
          type: string
        code:
          type: string
      x-apidog-orders:
        - error
        - message
        - code
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
  securitySchemes:
    bearerAuth:
      type: jwt
      scheme: bearer
      bearerFormat: JWT
      description: Token JWT obtido no login
    bearer:
      type: http
      scheme: bearer
servers:
  - url: https://yuanqfswhberkoevtmfr.supabase.co
    description: Prod Env
  - url: ''
    description: Cloud Mock
security:
  - bearer: []

```

