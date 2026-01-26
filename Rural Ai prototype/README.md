# SarvaSahay Platform

AI-powered government scheme eligibility and enrollment platform designed to bridge the information gap between rural Indian citizens and government benefits.

## Overview

SarvaSahay addresses the critical problem where eligible citizens miss ₹50,000-500,000 in annual benefits due to information barriers, complex eligibility rules, and bureaucratic friction. The platform uses machine learning to match user profiles against complex eligibility criteria, automates document processing and form submission, and provides real-time tracking of applications through government systems.

## Core Value Proposition

- **Instant Discovery**: AI-powered matching identifies all eligible government schemes within 5 seconds
- **Automated Enrollment**: Auto-fills and submits government forms using user profile and document data
- **Multi-Channel Access**: SMS, voice, web, and mobile interfaces for users with varying digital literacy
- **Real-Time Tracking**: Monitors application status across government systems with proactive notifications

## Key Metrics

- 30+ government schemes supported
- 1000+ eligibility rules processed
- 89% AI model accuracy for eligibility matching
- 99.5% uptime requirement during business hours
- <5 second response time for eligibility evaluation

## Technology Stack

### AI/ML Stack
- **XGBoost**: Extreme Gradient Boosting for eligibility matching (89% accuracy)
- **Tesseract 5.0**: OCR engine with custom Indian language models
- **OpenCV**: Image preprocessing for document enhancement
- **NLP Processor**: Speech-to-text conversion for voice interface

### Architecture
- **Microservices Architecture**: Domain-driven design with event-driven communication
- **API-First Design**: All services expose REST APIs with OpenAPI specifications
- **Stateless Services**: Designed for horizontal scaling
- **Event-Driven Communication**: Loose coupling between services via events

## Installation

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/sarvasahay/platform.git
   cd platform
   ```

2. **Install with uv (recommended)**
   ```bash
   # Install development dependencies
   uv pip install -e ".[dev]"
   
   # Or install all optional dependencies
   uv pip install -e ".[dev,ml,production]"
   ```

3. **Alternative: Install with pip**
   ```bash
   pip install -e ".[dev]"
   ```

### Production Setup

```bash
# Install production dependencies
uv pip install -e ".[production]"
```

## Development

### Running Tests

```bash
# Run all tests
pytest

# Run specific test categories
pytest tests/unit/          # Unit tests
pytest tests/property/      # Property-based tests (Hypothesis)
pytest tests/integration/   # Integration tests
pytest tests/load/          # Load tests

# Run with coverage
pytest --cov=services --cov-report=html

# Use the test runner script
./run_tests.sh              # Linux/Mac
run_tests.bat               # Windows
```

### Code Quality

```bash
# Format code
black .
isort .

# Lint code
flake8 .
mypy .

# Security scan
bandit -r services/

# Run all quality checks
pre-commit run --all-files
```

### Performance Requirements

- **Eligibility evaluation**: <5 seconds for 30+ schemes
- **Model inference**: <1 second response time
- **System uptime**: 99.5% during business hours
- **Concurrent users**: 1,000+ users, 10,000+ simultaneous evaluations

## Project Structure

```
├── services/                # Core microservices
│   ├── profile-service/     # User profile management
│   ├── eligibility-engine/  # AI-powered scheme matching
│   ├── document-processor/  # OCR and document validation
│   ├── auto-application/    # Form filling and submission
│   ├── tracking-service/    # Application status monitoring
│   └── notification-service/# Multi-channel communications
├── shared/                  # Shared components
│   ├── models/             # Data models and schemas
│   ├── utils/              # Common utilities
│   ├── config/             # Configuration management
│   └── middleware/         # API middleware components
├── ml/                     # AI/ML components
│   ├── models/             # XGBoost eligibility models
│   ├── training/           # Model training scripts
│   ├── data/               # Training and validation datasets
│   └── pipelines/          # ML deployment pipelines
├── api/                    # API layer
│   ├── gateway/            # API Gateway configuration
│   ├── specs/              # OpenAPI 3.0 specifications
│   └── docs/               # API documentation
├── tests/                  # Testing suite
│   ├── unit/               # Unit tests by service
│   ├── integration/        # Cross-service integration tests
│   ├── property/           # Property-based tests (Hypothesis)
│   ├── load/               # Performance and load tests
│   └── e2e/                # End-to-end user journey tests
└── infrastructure/         # Infrastructure & DevOps
    ├── docker/             # Container configurations
    ├── kubernetes/         # K8s deployment manifests
    └── terraform/          # Infrastructure as code
```

## API Documentation

The platform exposes REST APIs with OpenAPI 3.0 specifications:

- **Profile Service**: `/api/v1/profiles` - User profile management
- **Eligibility Engine**: `/api/v1/eligibility` - Scheme matching and evaluation
- **Document Processor**: `/api/v1/documents` - OCR and document validation
- **Auto-Application**: `/api/v1/applications` - Form submission automation
- **Tracking Service**: `/api/v1/tracking` - Application status monitoring

## Government Integration

The platform integrates with official government APIs:

- **PM-KISAN**: Direct integration with farmer registration API
- **DBT System**: Integration with Direct Benefit Transfer portal
- **PFMS**: Public Financial Management System for payment tracking
- **State APIs**: Maharashtra, Karnataka, Tamil Nadu government portals

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the coding standards
4. Run tests and ensure coverage (`pytest --cov=services`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Standards

- **Testing**: Minimum 90% code coverage required
- **Property-Based Testing**: Use Hypothesis framework with 100+ iterations
- **Performance**: All eligibility evaluations must complete within 5 seconds
- **Security**: All personal data must be encrypted at rest and in transit
- **Documentation**: All public APIs must have OpenAPI specifications

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: https://docs.sarvasahay.gov.in
- **Issues**: https://github.com/sarvasahay/platform/issues
- **Email**: support@sarvasahay.gov.in

## Acknowledgments

- Government of India for policy support
- Rural communities for feedback and testing
- Open source AI/ML community for foundational tools