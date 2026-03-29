# Teamwork Homecare Frontend

React-based frontend application for the Teamwork Physiotherapy Centre International.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd homecare-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
homecare-frontend/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts (Auth, Notifications)
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service layers
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   ├── config/            # Configuration files
│   ├── data/              # Mock data (for development)
│   ├── styles/            # Global styles
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Application entry point
├── public/                # Static assets
├── dist/                  # Build output
└── package.json           # Dependencies and scripts
```

## 🛠️ Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application for production
- `npm run preview` - Preview production build locally

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

### Type Checking
- `npm run type-check` - Run TypeScript compiler check

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_URL=http://51.20.55.20:3007/api
VITE_WS_URL=ws://localhost:3001/ws

# Upload Configuration
VITE_UPLOAD_URL=http://51.20.55.20:3007/api/upload

# App Configuration
VITE_APP_NAME=Teamwork Homecare
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_ANALYTICS=true

# Debug
VITE_DEBUG=false
VITE_LOG_LEVEL=info

# File Upload
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# External Services
VITE_SMS_SERVICE_URL=https://api.twilio.com
VITE_EMAIL_SERVICE_URL=https://api.sendgrid.com
VITE_PAYMENT_SERVICE_URL=https://api.stripe.com
```

## 🏗️ Architecture

### Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Form Handling**: Custom hooks with validation
- **Icons**: Lucide React
- **Charts**: Chart.js / Recharts (if needed)

### Key Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript support
- **Authentication**: JWT-based authentication with context
- **Real-time Updates**: WebSocket integration for live updates
- **File Upload**: Drag-and-drop file upload with validation
- **Error Handling**: Comprehensive error boundaries and handlers
- **Loading States**: Optimistic updates and loading indicators
- **Form Validation**: Client-side validation with custom rules

## 🎨 UI Components

### Core Components
- **Layout**: Main application layout with sidebar navigation
- **FormField**: Reusable form input components
- **LoadingSpinner**: Loading indicators and overlays
- **ErrorBoundary**: Error catching and display
- **NotificationCenter**: Real-time notification system

### Modal Components
- **AddEditPatientModal**: Patient registration and editing
- **AddEditNurseModal**: Nurse management
- **AddEditAppointmentModal**: Appointment scheduling
- **AddEditHealthRecordModal**: Health record management
- And many more specialized modals...

## 📱 Pages

### Core Pages
- **Dashboard**: Role-based dashboard with analytics
- **Patients**: Patient management and profiles
- **Nurses**: Nurse management and schedules
- **Appointments**: Scheduling and management
- **Health Records**: Medical record management
- **Billing**: Invoice and payment management

### Specialized Pages
- **Physiotherapy Centre**: Assessment and treatment management
- **Training**: Certification and training modules
- **Reports**: Analytics and reporting
- **Settings**: System configuration

## 🔐 Authentication

The application uses JWT-based authentication with:
- **AuthContext**: Centralized authentication state
- **Protected Routes**: Role-based access control
- **Token Management**: Automatic refresh and storage
- **Session Management**: Secure session handling

## 📊 State Management

- **AuthContext**: User authentication and profile
- **NotificationContext**: Global notification system
- **Custom Hooks**: Reusable state logic
- **Local Storage**: Persistent user preferences

## 🧪 Testing

```bash
# Run tests (when configured)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment-Specific Builds

The application supports different environments:
- **Development**: `npm run dev`
- **Staging**: `npm run build:staging`
- **Production**: `npm run build:production`

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `docs/` folder
- Review the API documentation

## 🔗 Related Projects

- **Backend**: Node.js/Express API (in `../homecare-backend/`)
- **Mobile App**: React Native mobile application
- **Admin Dashboard**: Administrative interface

## 📈 Performance

- **Bundle Size**: Optimized with Vite tree-shaking
- **Code Splitting**: Lazy-loaded routes and components
- **Caching**: Efficient API response caching
- **Images**: Optimized image loading and lazy loading

## 🔒 Security

- **XSS Protection**: Input sanitization and validation
- **CSRF Protection**: Token-based CSRF protection
- **Secure Headers**: Security headers configuration
- **Content Security Policy**: CSP implementation
