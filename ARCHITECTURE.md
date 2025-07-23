# Review System Microservice - Architecture Diagram

## System Overview

The Review System Microservice is a robust, scalable NestJS application designed to ingest hotel reviews from AWS S3, process and validate the data, and store it in a PostgreSQL database with comprehensive monitoring and automation capabilities.

## High-Level Architecture

```mermaid
graph TB
    subgraph "External Systems"
        S3[AWS S3 Bucket<br/>JSONL Files]
        Client[API Clients<br/>Manual Triggers]
        Scheduler[Cron Scheduler<br/>Daily Jobs]
    end

    subgraph "Review System Microservice"
        subgraph "API Layer"
            Controller[Ingestion Controller<br/>REST Endpoints]
            CLI[CLI Interface<br/>Command Line Tools]
        end

        subgraph "Business Logic Layer"
            IngestionSvc[Ingestion Service<br/>Orchestration & Flow Control]
            ReviewsSvc[Reviews Service<br/>Data Processing & Validation]
            S3Svc[S3 Service<br/>AWS Integration]
            CronTask[Cron Task<br/>Scheduled Jobs]
        end

        subgraph "Infrastructure Layer"
            Config[Config Service<br/>Environment Management]
            Logger[Logger Utility<br/>Structured Logging]
            Validation[Validation Pipes<br/>Data Validation]
        end
    end

    subgraph "Data Layer"
        DB[(PostgreSQL Database<br/>Reviews & Metadata)]
        Migrations[TypeORM Migrations<br/>Schema Management]
    end

    subgraph "DevOps & Monitoring"
        Docker[Docker Container<br/>Containerization]
        HealthCheck[Health Checks<br/>Service Monitoring]
        Tests[Test Suite<br/>83%+ Coverage]
    end

    %% Data Flow
    S3 --> S3Svc
    Client --> Controller
    Scheduler --> CronTask
    CLI --> IngestionSvc

    Controller --> IngestionSvc
    CronTask --> IngestionSvc
    IngestionSvc --> S3Svc
    IngestionSvc --> ReviewsSvc
    ReviewsSvc --> DB

    S3Svc --> Logger
    ReviewsSvc --> Logger
    IngestionSvc --> Logger

    Config --> IngestionSvc
    Config --> S3Svc
    Config --> DB

    Validation --> Controller
    Migrations --> DB

    %% Styling
    classDef external fill:#e1f5fe
    classDef api fill:#f3e5f5
    classDef business fill:#e8f5e8
    classDef infra fill:#fff3e0
    classDef data fill:#fce4ec
    classDef devops fill:#f1f8e9

    class S3,Client,Scheduler external
    class Controller,CLI api
    class IngestionSvc,ReviewsSvc,S3Svc,CronTask business
    class Config,Logger,Validation infra
    class DB,Migrations data
    class Docker,HealthCheck,Tests devops
```

## Detailed Component Architecture

### 1. API Layer Components

```mermaid
graph LR
    subgraph "API Layer"
        Controller[Ingestion Controller]
        CLI[CLI Interface]
    end

    subgraph "Endpoints"
        TriggerAPI[POST /ingestion/trigger<br/>Manual Ingestion]
        StatusAPI[GET /ingestion/status<br/>Status & Statistics]
        IngestCLI[npm run cli ingest<br/>CLI Ingestion]
        StatsCLI[npm run cli stats<br/>Statistics]
        StatusCLI[npm run cli status<br/>Status Check]
    end

    Controller --> TriggerAPI
    Controller --> StatusAPI
    CLI --> IngestCLI
    CLI --> StatsCLI
    CLI --> StatusCLI
```

### 2. Business Logic Layer

```mermaid
graph TB
    subgraph "Business Services"
        IngestionSvc[Ingestion Service<br/>🔄 Orchestration]
        ReviewsSvc[Reviews Service<br/>📝 Data Processing]
        S3Svc[S3 Service<br/>☁️ AWS Integration]
        CronTask[Cron Task<br/>⏰ Scheduling]
    end

    subgraph "Core Functions"
        subgraph "Ingestion Service"
            RunIngestion[runIngestion<br/>Main Process Flow]
            ChunkFiles[chunkArray<br/>Concurrent Processing]
            GetStatus[getIngestionStatus<br/>Status Reporting]
        end

        subgraph "Reviews Service"
            StoreReviews[storeReviews<br/>Data Persistence]
            ValidateData[validateReviewData<br/>Business Rules]
            TransformData[transformReviewData<br/>Data Mapping]
            CheckProcessed[isFileProcessed<br/>Idempotency]
        end

        subgraph "S3 Service"
            ListFiles[listFiles<br/>File Discovery]
            StreamData[streamJsonLines<br/>Data Streaming]
            ParseJSON[parseJsonLines<br/>JSON Processing]
            GetMetadata[getFileMetadata<br/>File Info]
        end
    end

    IngestionSvc --> RunIngestion
    IngestionSvc --> ChunkFiles
    IngestionSvc --> GetStatus

    ReviewsSvc --> StoreReviews
    ReviewsSvc --> ValidateData
    ReviewsSvc --> TransformData
    ReviewsSvc --> CheckProcessed

    S3Svc --> ListFiles
    S3Svc --> StreamData
    S3Svc --> ParseJSON
    S3Svc --> GetMetadata
```

### 3. Data Flow Architecture

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant IngestionSvc
    participant S3Svc
    participant ReviewsSvc
    participant Database
    participant Logger

    Client->>Controller: POST /ingestion/trigger
    Controller->>Logger: Log API request
    Controller->>IngestionSvc: triggerManualIngestion()
    
    IngestionSvc->>Logger: Log ingestion start
    IngestionSvc->>S3Svc: listFiles(bucket, prefix)
    S3Svc->>Logger: Log files found
    S3Svc-->>IngestionSvc: file list
    
    loop For each file chunk
        IngestionSvc->>ReviewsSvc: isFileProcessed(fileName)
        ReviewsSvc-->>IngestionSvc: boolean
        
        alt File not processed
            IngestionSvc->>S3Svc: getFileMetadata(bucket, key)
            IngestionSvc->>S3Svc: streamJsonLines(bucket, key)
            S3Svc->>S3Svc: parseJsonLines(stream)
            S3Svc-->>IngestionSvc: parsed data
            
            IngestionSvc->>ReviewsSvc: storeReviews(data, fileName)
            ReviewsSvc->>ReviewsSvc: transformReviewData()
            ReviewsSvc->>ReviewsSvc: validateReviewData()
            ReviewsSvc->>Database: save reviews
            ReviewsSvc->>Database: mark file as processed
            ReviewsSvc->>Logger: Log processing results
        else File already processed
            IngestionSvc->>Logger: Log file skipped
        end
    end
    
    IngestionSvc->>Logger: Log ingestion complete
    IngestionSvc-->>Controller: processing results
    Controller-->>Client: JSON response
```

### 4. Database Schema Architecture

```mermaid
erDiagram
    REVIEWS {
        int id PK
        int hotelId
        string platform
        string hotelName
        bigint hotelReviewId
        int providerId
        decimal rating
        text reviewComments
        timestamp reviewDate
        string reviewerCountryName
        string reviewerDisplayName
        int lengthOfStay
        jsonb overallByProviders
        timestamp createdAt
        timestamp updatedAt
    }

    PROCESSED_FILES {
        int id PK
        string fileName UK
        timestamp processedAt
        int reviewCount
        timestamp createdAt
    }

    REVIEWS ||--o{ PROCESSED_FILES : "tracked by"
```

### 5. Configuration & Environment Architecture

```mermaid
graph TB
    subgraph "Configuration Management"
        EnvFile[.env File<br/>Local Development]
        EnvVars[Environment Variables<br/>Production]
        ConfigSvc[Config Service<br/>Centralized Access]
    end

    subgraph "Configuration Categories"
        DatabaseConfig[Database Config<br/>DB_HOST, DB_PORT, etc.]
        AWSConfig[AWS Config<br/>AWS_REGION, S3_BUCKET, etc.]
        AppConfig[Application Config<br/>PORT, NODE_ENV, etc.]
        IngestionConfig[Ingestion Config<br/>CONCURRENCY, etc.]
    end

    EnvFile --> ConfigSvc
    EnvVars --> ConfigSvc
    ConfigSvc --> DatabaseConfig
    ConfigSvc --> AWSConfig
    ConfigSvc --> AppConfig
    ConfigSvc --> IngestionConfig
```

### 6. Error Handling & Logging Architecture

```mermaid
graph TB
    subgraph "Error Handling Strategy"
        GlobalPipes[Global Validation Pipes<br/>Input Validation]
        ServiceErrors[Service Level Errors<br/>Business Logic]
        InfraErrors[Infrastructure Errors<br/>AWS, Database]
        Logger[Structured Logger<br/>Centralized Logging]
    end

    subgraph "Error Types"
        ValidationErr[Validation Errors<br/>400 Bad Request]
        BusinessErr[Business Logic Errors<br/>422 Unprocessable]
        InfraErr[Infrastructure Errors<br/>500 Internal Server]
        NotFoundErr[Resource Not Found<br/>404 Not Found]
    end

    subgraph "Logging Levels"
        LogInfo[INFO<br/>Normal Operations]
        LogWarn[WARN<br/>Recoverable Issues]
        LogError[ERROR<br/>Critical Failures]
        LogDebug[DEBUG<br/>Development Only]
    end

    GlobalPipes --> ValidationErr
    ServiceErrors --> BusinessErr
    InfraErrors --> InfraErr

    ValidationErr --> Logger
    BusinessErr --> Logger
    InfraErr --> Logger
    NotFoundErr --> Logger

    Logger --> LogInfo
    Logger --> LogWarn
    Logger --> LogError
    Logger --> LogDebug
```

### 7. Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        DevDocker[Docker Compose Dev<br/>Local PostgreSQL]
        DevApp[NestJS Dev Server<br/>Hot Reload]
        DevTests[Test Suite<br/>83%+ Coverage]
    end

    subgraph "Production Environment"
        ProdDocker[Docker Container<br/>Multi-stage Build]
        ProdDB[PostgreSQL Database<br/>Managed Service]
        ProdS3[AWS S3 Bucket<br/>Review Data Source]
        LoadBalancer[Load Balancer<br/>High Availability]
    end

    subgraph "CI/CD Pipeline"
        GitHub[GitHub Repository<br/>Source Control]
        Actions[GitHub Actions<br/>CI/CD Workflow]
        Registry[Container Registry<br/>Docker Images]
        Deploy[Deployment<br/>Automated]
    end

    GitHub --> Actions
    Actions --> DevTests
    Actions --> Registry
    Registry --> ProdDocker
    Deploy --> ProdDocker
    ProdDocker --> ProdDB
    ProdDocker --> ProdS3
    LoadBalancer --> ProdDocker
```

## Key Architectural Patterns

### 1. **Layered Architecture**
- **API Layer**: Controllers and CLI interfaces
- **Business Logic Layer**: Services with domain logic
- **Infrastructure Layer**: External integrations and utilities
- **Data Layer**: Database entities and repositories

### 2. **Dependency Injection**
- NestJS built-in DI container
- Service-to-service dependencies
- Configuration injection
- Testability through mocking

### 3. **Repository Pattern**
- TypeORM repositories for data access
- Entity-based data modeling
- Migration-based schema management

### 4. **Strategy Pattern**
- Configurable concurrency processing
- Multiple data validation strategies
- Pluggable logging mechanisms

### 5. **Observer Pattern**
- Event-driven logging
- Status monitoring and reporting
- Error notification system

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: No session state, enables multiple instances
- **Database Connection Pooling**: Efficient resource utilization
- **Concurrent Processing**: Configurable file processing parallelism
- **Idempotent Operations**: Safe retry mechanisms

### Performance Optimization
- **Streaming Data Processing**: Memory-efficient large file handling
- **Batch Processing**: Chunked file processing for better throughput
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Reuse**: AWS SDK connection pooling

### Monitoring & Observability
- **Structured Logging**: JSON-formatted logs with context
- **Health Checks**: Docker health check endpoints
- **Metrics Collection**: Processing statistics and performance data
- **Error Tracking**: Comprehensive error logging and reporting

## Security Architecture

### Data Security
- **Environment Variables**: Sensitive configuration management
- **Input Validation**: Global validation pipes
- **SQL Injection Prevention**: TypeORM parameterized queries
- **Error Information Leakage**: Sanitized error responses

### Infrastructure Security
- **Non-root Container**: Docker security best practices
- **AWS IAM**: Least privilege access to S3 resources
- **Database Security**: Connection encryption and authentication
- **Network Security**: Container network isolation

This architecture provides a solid foundation for a production-ready microservice with excellent maintainability, scalability, and reliability characteristics.