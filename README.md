# UFC Picks

A competitive prediction platform for UFC events. Make fight predictions, track your accuracy, and climb the leaderboards against other fans.

## Features

- Real-time UFC event tracking with countdown timers
- Fight outcome predictions for all card levels (Main Event, Main Card, Prelims, Early Prelims)
- Global and category-specific leaderboards
- Personal statistics and performance analytics
- Responsive design optimized for mobile and desktop
- Dark mode support

## Tech Stack

### Frontend
- Next.js 14+ (App Router)
- React 18.3
- TypeScript 5.8
- Tailwind CSS 3.4
- shadcn/ui (Radix UI primitives)

### State Management
- TanStack Query (React Query 5)
- Next.js Server Components

### Styling
- Tailwind CSS with custom design system
- CSS Variables for dynamic theming
- next-themes for dark mode management

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ufc-picks/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional):
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Run the development server:
```bash
npm run dev
```

5. Open your browser and navigate to:
```
http://localhost:8080
```

The application will automatically reload when you make changes to the source files.

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication route group
│   │   │   └── auth/          # Login/register pages
│   │   ├── (main)/            # Main application route group
│   │   │   ├── events/        # Events listing and detail pages
│   │   │   ├── my-picks/      # User picks history
│   │   │   ├── leaderboards/  # Competition rankings
│   │   │   └── profile/       # User profile and settings
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Home page
│   │   └── providers.tsx      # Client-side providers
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui component library
│   │   ├── AppLayout.tsx     # Main application layout
│   │   ├── DesktopSidebar.tsx # Desktop navigation
│   │   ├── BottomNav.tsx     # Mobile navigation
│   │   └── ...               # Domain-specific components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   └── index.css             # Global styles and CSS variables
├── public/                    # Static assets
├── next.config.js            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## Available Scripts

### Development
```bash
npm run dev          # Start development server on port 8080
```

### Production
```bash
npm run build        # Build optimized production bundle
npm run start        # Start production server
```

### Code Quality
```bash
npm run lint         # Run ESLint checks
npm run type-check   # Run TypeScript type checking
```

## Deployment

### Vercel (Recommended)

Vercel provides the optimal deployment experience for Next.js applications.

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Visit [vercel.com](https://vercel.com) and sign in
3. Click "Import Project" and select your repository
4. Configure the project:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `frontend`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
5. Add environment variables if needed
6. Click "Deploy"

Your application will be deployed with automatic HTTPS, global CDN, and continuous deployment from your Git repository.

### Other Platforms

The application can be deployed to any platform that supports Node.js applications:

#### Netlify
```bash
npm run build
# Deploy the .next directory
```

#### Railway
```bash
railway init
railway up
```

#### Docker
Build and run using Docker:
```bash
docker build -t ufc-picks .
docker run -p 8080:8080 ufc-picks
```

#### Traditional Hosting (VPS, AWS EC2, etc.)
```bash
npm run build
npm run start
# Use a process manager like PM2:
npm install -g pm2
pm2 start npm --name "ufc-picks" -- start
```

## Environment Variables

Create a `.env.local` file in the frontend directory:

```env
# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:8080

# Backend API URL (when available)
# NEXT_PUBLIC_API_URL=https://api.example.com
```

Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Development Guidelines

### Adding New Pages

1. Create a new directory in `src/app/(main)/` or `src/app/(auth)/`
2. Add a `page.tsx` file with metadata export
3. Create a client component if interactivity is needed
4. Update navigation in `DesktopSidebar.tsx` and `BottomNav.tsx`

### Adding Components

- Place reusable UI components in `src/components/ui/`
- Place domain-specific components in `src/components/`
- Use the shadcn CLI to add new UI components:
  ```bash
  npx shadcn-ui@latest add [component-name]
  ```

### Styling Guidelines

- Use Tailwind utility classes for layout and common styles
- Define color tokens in `src/index.css` using CSS variables
- Use the `cn()` utility from `lib/utils.ts` for conditional classes
- Follow the existing color system (primary, secondary, accent, etc.)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please ensure your code follows the existing style and all tests pass.

## Code Style

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting (if configured)
- Follow Next.js and React best practices
- Use functional components with hooks
- Prefer server components when possible

## Performance Optimization

The application uses several optimization techniques:

- Next.js App Router with Server Components
- Automatic code splitting
- Image optimization with next/image (when images are added)
- Font optimization with next/font
- CSS optimization with Tailwind
- Production builds are optimized for performance

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions:

- Open an issue on GitHub
- Check existing issues before creating new ones
- Provide detailed information for bug reports

## Acknowledgments

- Built with Next.js by Vercel
- UI components from shadcn/ui
- Icons from Lucide React
- Styling with Tailwind CSS
