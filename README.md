# 🎮 Bargain Hunter - Shopify Gaming Application

A gamified discount application for Shopify stores that engages customers through an interactive mini-game where they can earn discounts based on their performance.

## 🌟 Features

- **Interactive Game**: HTML5 Canvas-based endless runner game
- **Discount System**: Score-based discount tiers (5% to 25% OFF)
- **Multiple Widget Modes**: Popup, tab, and inline display options
- **Mobile Responsive**: Touch controls for mobile devices
- **Admin Dashboard**: Complete configuration and analytics interface
- **Real-time Analytics**: Track game performance and conversions
- **Customizable Appearance**: Brand colors and themes
- **Fraud Prevention**: Rate limiting and score validation

## 🎯 Game Mechanics

### How to Play
- **Desktop**: Use SPACE/↑ to jump, ↓ to slide
- **Mobile**: Tap upper half to jump, lower half to slide
- **Goal**: Collect discount tags and avoid obstacles
- **Scoring**: Distance traveled + collected items = final score

### Discount Tiers
- 150+ points = 5% OFF
- 300+ points = 10% OFF  
- 500+ points = 15% OFF
- 750+ points = 20% OFF
- 1000+ points = 25% OFF

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Shopify Partner account (for production)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd bargain-hunter
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Run development server**
```bash
npm run dev
```

5. **Open the application**
Visit `http://localhost:3000` to access the application.

## 📁 Project Structure

```
bargain-hunter/
├── pages/                    # Next.js pages
│   ├── api/                 # API endpoints
│   │   ├── game/           # Game-related APIs
│   │   └── widget/         # Widget embed script
│   ├── widget/             # Widget pages
│   ├── dashboard.tsx       # Main dashboard page
│   └── index.tsx           # Main entry point
├── src/
│   ├── components/         # React components
│   │   ├── Game/          # Game engine components
│   │   └── Widget/        # Widget components
│   ├── types/             # TypeScript type definitions
│   └── styles/            # Global styles
├── public/                # Static assets
└── shopify.app.toml      # Shopify app configuration
```

## 🎮 Game Engine Architecture

The game is built with HTML5 Canvas and includes:

- **GameEngine.tsx**: Main game loop and state management
- **PlayerEntity**: Character physics and animations
- **ObstacleManager**: Obstacle spawning and collision detection
- **CollectibleManager**: Collectible items and scoring
- **GameOverScreen**: Results and discount display

### Key Features:
- 60 FPS game loop with requestAnimationFrame
- Physics-based movement with gravity
- Progressive difficulty scaling
- Mobile touch controls
- Real-time score calculation

## 🔧 API Endpoints

### Game APIs
- `GET /api/game/config/[shop]` - Get game configuration
- `POST /api/game/start-session` - Start new game session
- `POST /api/game/finish-session` - Complete game and generate discount

### Widget APIs
- `GET /api/widget/embed` - JavaScript embed script
- `GET /widget/game` - Embeddable game iframe

## 🎨 Widget Integration

### Embed Script
Add to your Shopify theme:
```html
<script src="https://your-app.vercel.app/widget/embed.js?shop=your-shop.myshopify.com"></script>
```

### Display Modes
1. **Popup Modal**: Full-screen overlay
2. **Corner Tab**: Floating tab widget
3. **Inline**: Embedded in page content

### Trigger Options
- Immediate display
- Time delay
- Scroll percentage
- Exit intent

## 📊 Analytics & Metrics

Track key performance indicators:
- Total games played
- Conversion rate (discounts used)
- Average order value
- Revenue generated
- Top scores and player engagement

## 🔒 Security Features

- **Rate Limiting**: Prevent abuse with play limits
- **Score Validation**: Detect impossible scores
- **Session Management**: Secure game sessions
- **GDPR Compliance**: Privacy-focused data handling

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Testing
```bash
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm run start
```

## 📝 Configuration

### Game Settings
- Minimum score for discount
- Maximum plays per customer/day
- Game speed and difficulty
- Discount tier configuration

### Widget Settings
- Display mode and position
- Trigger events and timing
- Page targeting rules

### Appearance
- Brand colors and themes
- Custom logos and backgrounds
- CSS customization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Open an issue on GitHub
- Contact the development team

## 🎯 Roadmap

- [ ] Multiple game types
- [ ] Advanced analytics dashboard
- [ ] A/B testing capabilities
- [ ] Multi-language support
- [ ] Advanced fraud detection
- [ ] Custom game themes

---

Built with ❤️ for the Shopify ecosystem
