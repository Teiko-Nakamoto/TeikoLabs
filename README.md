# Create Token JS - Stacks Blockchain Token Creation Platform

A comprehensive Next.js application for creating and managing tokens on the Stacks blockchain with integrated DEX functionality, admin dashboard, and API management.

## 🚀 Features

### Core Functionality
- **Token Creation**: Deploy custom tokens on Stacks blockchain (testnet/mainnet)
- **DEX Integration**: Built-in decentralized exchange for token trading
- **Treasury Management**: Project treasury with fee collection and governance
- **Wallet Integration**: Seamless Stacks wallet connectivity

### Admin Features
- **Admin Dashboard**: Comprehensive management interface
- **API Management**: CORS configuration and rate limiting
- **Content Management**: Edit homepage and manage platform content
- **User Token Management**: Monitor and manage user-created tokens

### Technical Features
- **Multi-language Support**: Internationalization (i18n) with 13 languages
- **Responsive Design**: Mobile-first responsive UI
- **Real-time Data**: Live price feeds and trading data
- **Security**: CORS protection, rate limiting, and authentication
- **Database Integration**: Supabase backend with comprehensive schema

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, CSS3
- **Blockchain**: Stacks (Clarity smart contracts)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom admin auth system
- **Deployment**: Vercel-ready configuration

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Teiko-Nakamoto/create-token-js.git
   cd create-token-js
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with your configuration:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Database Setup**
   Run the SQL scripts in the root directory:
   ```bash
   # Setup user tokens table
   node setup-user-tokens.js
   
   # Setup CORS table
   node setup-cors-table.js
   
   # Setup app settings
   node setup-app-settings.js
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🎯 Usage

### Creating a Token
1. Navigate to `/create-project`
2. Connect your Stacks wallet
3. Enter project details (name and initials)
4. Deploy token to blockchain
5. Create project treasury
6. Mint treasury ownership tokens

### Admin Access
1. Navigate to `/admin`
2. Use admin wallet authentication
3. Access dashboard for platform management

### API Management
- **CORS Configuration**: `/admin/api-management`
- **Rate Limiting**: Configure request limits
- **Token Management**: Monitor user tokens

## 📁 Project Structure

```
create-token-js/
├── src/
│   ├── app/
│   │   ├── admin/           # Admin dashboard
│   │   ├── api/            # API routes
│   │   ├── create-project/ # Token creation
│   │   ├── docs/           # Documentation
│   │   ├── trade/          # Trading interface
│   │   └── utils/          # Utility functions
│   └── contracts/          # Smart contract templates
├── public/
│   ├── icons/             # UI icons
│   └── locales/           # Translation files
└── gaia-hub-local/        # Local Gaia hub
```

## 🔧 Configuration

### Smart Contracts
- **Token Template**: `src/app/contracts/token-template.clarity`
- **DEX Template**: `src/app/contracts/dex-template.clarity`
- **Contract Generator**: `src/app/contracts/token-generator.js`

### Database Schema
- **User Tokens**: `user-tokens-schema.sql`
- **CORS Management**: `cors-table-schema.sql`
- **App Settings**: `app-settings-schema.sql`

## 🌐 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GAIA_HUB_URL=
```

## 📚 Documentation

- **API Documentation**: `/docs`
- **CORS Management**: `CORS-MANAGEMENT.md`
- **User Tokens System**: `USER-TOKENS-SYSTEM.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **GitHub Repository**: https://github.com/Teiko-Nakamoto/create-token-js
- **Stacks Documentation**: https://docs.stacks.co/
- **Supabase Documentation**: https://supabase.com/docs

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation at `/docs`
- Review the troubleshooting guides

---

**Note**: This is a production-ready platform for creating and managing tokens on the Stacks blockchain. Ensure you have proper testing and security measures in place before deploying to mainnet.