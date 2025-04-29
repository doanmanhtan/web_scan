# Source Code Scanner Backend

Backend service for scanning and analyzing source code to detect vulnerabilities, code quality issues, and potential bugs.

## Features

- **Multiple Analysis Tools:** Integrates with Semgrep, Snyk, and ClangTidy for comprehensive code analysis
- **File Upload:** Support for uploading individual files or entire directories
- **In-depth Reports:** Generate detailed reports with visualizations
- **Vulnerability Tracking:** Manage and track discovered vulnerabilities
- **User Management:** Role-based access control

## Prerequisites

- Node.js 16+
- MongoDB 4.4+
- Semgrep
- Snyk (optional)
- ClangTidy (optional for C/C++ analysis)

## Getting Started

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/source-code-scanner-backend.git
   cd source-code-scanner-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```
   
4. Edit the `.env` file to match your environment.

### Running with Docker

The easiest way to start the application is using Docker Compose:

```
docker-compose up
```

This will start:
- The backend service
- MongoDB database
- Mongo Express (web-based MongoDB admin interface)

### Running without Docker

1. Make sure MongoDB is running.

2. Run the application:
   ```
   npm run dev
   ```

## API Documentation

The API provides the following main endpoints:

- `/api/users` - User management
- `/api/scans` - Scan creation and management
- `/api/reports` - Report generation and management
- `/api/vulnerabilities` - Vulnerability tracking
- `/api/settings` - System and user settings

For detailed API documentation, see the [API Reference](docs/api/README.md).

## Directory Structure

```
source-code-scanner-backend/
├── src/                        # Source code
│   ├── api/                    # API routes, controllers
│   │   ├── controllers/        # Request handlers
│   │   ├── routes/             # API route definitions
│   │   └── middleware/         # Express middleware
│   ├── services/               # Business logic
│   ├── scanners/               # Scanner integrations
│   ├── db/                     # Database models and repositories
│   ├── utils/                  # Utility functions
│   ├── config/                 # Configuration files
│   ├── scripts/                # Utility scripts
│   └── app.js                  # Entry point
├── tests/                      # Tests
├── uploads/                    # Uploaded files (git-ignored)
├── scans/                      # Scan results (git-ignored)
├── reports/                    # Generated reports (git-ignored)
├── logs/                       # Log files (git-ignored)
└── docs/                       # Documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.