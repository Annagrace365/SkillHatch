# SkillHatch - Personalized Startup Ideas Generator

SkillHatch is a comprehensive web application that generates personalized startup ideas based on users' skills, experience level, and interests. Built with modern technologies and designed for students and aspiring entrepreneurs, it provides an intelligent matching system that connects users with relevant entrepreneurial opportunities.

## 🚀 Features

### Core Functionality
- **Intelligent Idea Generation**: AI-powered matching algorithm that analyzes user skills and interests against a curated database of 17+ startup ideas
- **Personalized Recommendations**: Smart filtering system that matches users with startup opportunities based on their experience level and preferences
- **Audio Overviews**: Text-to-speech functionality for idea summaries using ElevenLabs API for accessibility and convenience
- **Interactive Progress Tracking**: Comprehensive startup journey tracker with ordered milestone progression (Validate → Research → MVP → Launch → Monetize → Scale)
- **Favorites System**: Save and manage favorite startup ideas with secure user authentication and cloud storage

### Premium Features (Subscription-Based)
- **Deep Market Analysis Reports**: Comprehensive PDF reports with market research, competitive analysis, and financial projections
- **Professional Startup Toolkit**: Business plan templates, pitch deck outlines, and professional documentation
- **Priority Support**: Enhanced customer support for premium subscribers
- **Advanced Analytics**: Detailed insights and recommendations for startup success

### User Experience
- **Responsive Design**: Beautiful, production-ready interface optimized for all devices (mobile, tablet, desktop)
- **Real-time Authentication**: Secure user registration and login with Supabase Auth
- **Interactive UI**: Smooth animations, hover effects, and micro-interactions for enhanced user engagement
- **Modern Design**: Apple-level design aesthetics with gradient backgrounds, polished components, and intuitive navigation
- **Accessibility**: Audio features, keyboard navigation, and screen reader support

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe development and modern component architecture
- **Tailwind CSS** for responsive styling, design system, and rapid UI development
- **Lucide React** for consistent iconography and scalable vector icons
- **React Router** for client-side navigation and routing
- **Vite** for fast development server and optimized production builds

### Backend & Database
- **Supabase** for authentication, PostgreSQL database, and real-time features
- **PostgreSQL** with Row Level Security (RLS) for data protection and user isolation
- **Supabase Edge Functions** for serverless API endpoints and business logic

### Integrations & APIs
- **Stripe** for payment processing and subscription management
- **ElevenLabs API** for high-quality text-to-speech audio generation
- **jsPDF** for dynamic PDF report generation

### Development Tools
- **TypeScript** for type safety and better developer experience
- **ESLint** for code quality and consistency
- **PostCSS** with Autoprefixer for CSS processing

## 📋 Prerequisites

Before setting up SkillHatch, ensure you have:

- **Node.js 18+** and npm installed
- **Supabase account** and project (free tier available)
- **Stripe account** for payment processing (optional for basic features)
- **ElevenLabs API key** for audio features (optional)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd skillhatch
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# ElevenLabs API Key (Optional - for audio features)
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

**To get Supabase credentials:**
1. Visit [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. Go to Settings → API
4. Copy the Project URL and anon/public key

**To get ElevenLabs API key:**
1. Visit [ElevenLabs](https://elevenlabs.io)
2. Create an account and get your API key
3. Add it to your `.env` file

### 4. Database Setup

The project includes comprehensive Supabase migrations that automatically set up:

- **User authentication and profiles** linked to Supabase Auth
- **Startup ideas database** with 17+ pre-seeded ideas covering various industries
- **Favorites system** with Row Level Security (RLS) policies
- **Stripe integration tables** for payment processing
- **Progress tracking system** for startup milestones

The migrations will run automatically when you connect to Supabase.

### 5. Stripe Configuration (Optional)

For premium features, configure Stripe:

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Update the `stripe-config.ts` file with your product/price IDs
4. Deploy the Stripe webhook endpoint using Supabase Edge Functions

### 6. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🗄️ Database Schema

### Core Tables

#### `users`
- **Purpose**: User profiles linked to Supabase Auth
- **Key Fields**: `id`, `email`, `name`, `is_premium`, `created_at`
- **Security**: RLS enabled, users can only access their own data

#### `startup_ideas`
- **Purpose**: Comprehensive startup idea database
- **Key Fields**: `title`, `description`, `market_size`, `difficulty`, `required_skills`, `target_interests`
- **Features**: Full-text search, JSONB arrays for flexible data storage
- **Content**: 17+ pre-seeded startup ideas covering education, technology, sustainability, and more

#### `favorites`
- **Purpose**: User's saved startup ideas
- **Key Fields**: `user_id`, `idea_data` (JSONB)
- **Security**: RLS policies ensure users only see their own favorites

#### Stripe Integration Tables
- **`stripe_customers`**: Links Supabase users to Stripe customers
- **`stripe_subscriptions`**: Manages subscription data and status
- **`stripe_orders`**: Stores order/purchase information

### Key Features
- **Row Level Security (RLS)** on all tables for data protection
- **Automatic user profile creation** via database triggers
- **JSONB fields** for flexible data storage (skills, features, keywords)
- **Full-text search** capabilities on startup ideas
- **Soft delete patterns** for data integrity

## 🎯 Usage Guide

### For Users

#### 1. **Account Creation**
- Sign up with email and password (no email confirmation required)
- Automatic profile creation and secure authentication

#### 2. **Generate Ideas**
- Input your technical skills (e.g., Web Development, Design, Marketing)
- Select experience level (Beginner, Intermediate, Advanced)
- Choose interests (e.g., Education, Healthcare, Technology)
- Get personalized startup recommendations

#### 3. **Explore Ideas**
- View detailed startup ideas with market analysis
- Listen to audio overviews for accessibility
- Save favorites for later review
- Track progress with interactive milestone system

#### 4. **Premium Features**
- Upgrade to access market analysis reports
- Download professional startup toolkits
- Get priority support and advanced features

### For Developers

#### **Project Structure**
```
src/
├── components/          # Reusable UI components
├── pages/              # Route-specific page components
├── utils/              # Utility functions and helpers
├── types/              # TypeScript type definitions
├── lib/                # Third-party library configurations
└── stripe-config.ts    # Stripe product configuration
```

#### **Key Components**
- **`StartupForm`**: User input collection with skill/interest selection
- **`StartupIdeaCard`**: Individual idea display with actions
- **`AuthModal`**: User authentication interface
- **`ProgressTracker`**: Interactive milestone tracking system

#### **Development Features**
- **Modular Architecture**: Clean separation of concerns with organized file structure
- **Type Safety**: Full TypeScript implementation with proper interfaces
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Performance Optimized**: Lazy loading, efficient state management

## 🔐 Security Features

### Authentication & Authorization
- **Supabase Authentication** with email/password
- **JWT token management** for secure API calls
- **Row Level Security (RLS)** for database-level protection
- **Input validation** and sanitization

### Data Protection
- **User data isolation** through RLS policies
- **Secure API endpoints** with authentication checks
- **Environment variable protection** for sensitive data
- **CORS configuration** for API security

### Privacy & Compliance
- **User data ownership** - users control their own data
- **Secure favorites storage** in cloud database
- **No tracking** of personal information beyond necessary functionality

## 🚀 Deployment

### Recommended Deployment Stack
- **Frontend**: Vercel, Netlify, or similar static hosting
- **Backend**: Supabase (handles database, auth, and edge functions)
- **CDN**: Automatic with most hosting providers

### Build Process
```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to your preferred platform
```

### Environment Variables for Production
Ensure all environment variables are properly configured in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ELEVENLABS_API_KEY` (optional)

## 📊 Analytics & Monitoring

### Built-in Analytics
- **User engagement tracking** through progress milestones
- **Idea generation analytics** for optimization
- **Subscription conversion metrics** via Stripe
- **Error monitoring** and performance tracking

### Key Metrics
- User registration and retention rates
- Idea generation and favoriting patterns
- Premium conversion rates
- Audio feature usage statistics

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Test thoroughly across different devices
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards
- **TypeScript**: All new code must be properly typed
- **Responsive Design**: Test on mobile, tablet, and desktop
- **Accessibility**: Follow WCAG guidelines
- **Performance**: Optimize for fast loading and smooth interactions

## 📝 API Documentation

### Supabase Edge Functions

#### `/stripe-checkout`
- **Purpose**: Create Stripe checkout sessions
- **Method**: POST
- **Authentication**: Required
- **Parameters**: `price_id`, `mode`, `success_url`, `cancel_url`

#### `/stripe-webhook`
- **Purpose**: Handle Stripe webhook events
- **Method**: POST
- **Authentication**: Stripe signature verification
- **Events**: Subscription updates, payment confirmations

### Database Views

#### `stripe_user_subscriptions`
- **Purpose**: Secure view of user subscription data
- **Access**: Authenticated users only (own data)
- **Fields**: Subscription status, pricing, payment methods

## 🔮 Roadmap

### Upcoming Features
- **AI-Enhanced Matching**: Machine learning for better idea recommendations
- **Community Features**: User forums and idea collaboration
- **Mobile App**: Native iOS and Android applications
- **Advanced Analytics**: Detailed market trend analysis
- **Mentor Network**: Connect with experienced entrepreneurs
- **Funding Integration**: Direct connections to investors and funding platforms

### Technical Improvements
- **Real-time Collaboration**: Live editing and sharing features
- **Advanced Search**: Semantic search with AI
- **Internationalization**: Multi-language support
- **Performance Optimization**: Further speed improvements

## 🆘 Support & Troubleshooting

### Common Issues

#### **Authentication Problems**
- Ensure Supabase credentials are correctly configured
- Check that RLS policies are properly set up
- Verify user profile creation triggers are working

#### **Audio Features Not Working**
- Confirm ElevenLabs API key is valid and has credits
- Check browser permissions for audio playback
- Verify network connectivity to ElevenLabs API

#### **Payment Issues**
- Ensure Stripe webhooks are properly configured
- Check Stripe product/price IDs in configuration
- Verify webhook endpoint is accessible

### Getting Help
- **Email**: support@skillhatch.com
- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Use GitHub Issues for bug reports and feature requests

### Performance Tips
- **Clear browser cache** if experiencing loading issues
- **Check network connection** for API-dependent features
- **Update browser** for best compatibility

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

### Technologies Used
- **Supabase** for backend infrastructure
- **Stripe** for payment processing
- **ElevenLabs** for text-to-speech capabilities
- **Tailwind CSS** for styling framework
- **React** and **TypeScript** for frontend development

### Design Inspiration
- Modern SaaS applications
- Educational technology platforms
- Startup ecosystem tools

---

**Built with ❤️ by the SkillHatch team**

*Empowering the next generation of entrepreneurs with personalized startup opportunities and comprehensive business tools.*

---

## Quick Start Checklist

- [ ] Clone repository and install dependencies
- [ ] Set up Supabase project and get credentials
- [ ] Configure environment variables
- [ ] Run development server
- [ ] Test user registration and idea generation
- [ ] (Optional) Configure Stripe for premium features
- [ ] (Optional) Set up ElevenLabs for audio features
- [ ] Deploy to production platform

For detailed setup instructions, refer to the Installation & Setup section above.