# ChatGPT Clone

A modern, full-featured ChatGPT clone built with Next.js 15, TypeScript, and Clerk authentication. Features real-time chat, file uploads, user-specific conversations, and webhook support for external integrations.

## ✨ Features

- 💬 **Real-time Chat** - Streaming AI responses with modern UI
- 🔐 **User Authentication** - Secure login/logout with Clerk
- 👤 **Personal Conversations** - Each user has their own chat history
- 📁 **File Upload** - Images, PDFs, documents with Cloudinary and Uploadcare
- 🎨 **Modern UI** - Dark theme, mobile responsive
- 🔗 **Webhook Support** - External service integration
- ✏️ **Message Editing** - Edit and regenerate responses
- 🗂️ **Chat Management** - Pin, archive, rename conversations

## 🛠️ Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Clerk** for authentication
- **Groq** for AI (Llama 3)
- **Cloudinary** for file storage
- **Zustand** for state management
- **Tailwind CSS** + Radix UI(ShadCN)

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/chatgpt-clone.git
cd chatgpt-clone
npm install
```

### 2. Environment Setup

Create `.env.example` to `.env.local` in the root directory:

### 3. Get Your API Keys

#### Required Services:

**🔐 Clerk (Authentication)**
1. Go to [clerk.com](https://clerk.com) → Create account
2. Create new application
3. Copy Publishable Key and Secret Key
4. Add `http://localhost:3000` to allowed origins

**🤖 Groq (AI)**
1. Go to [console.groq.com](https://console.groq.com)
2. Create API key
3. Free tier available with rate limits

**☁️ Cloudinary (File Storage)**
1. Go to [cloudinary.com](https://cloudinary.com)
2. Create free account
3. Get Cloud Name, API Key, and API Secret from dashboard

#### Optional Services:

- **MongoDB**: [mongodb.com](https://mongodb.com) - For advanced data storage
- **Mem0**: [mem0.ai](https://mem0.ai) - For conversation memory
- **OpenAI**: [platform.openai.com](https://platform.openai.com) - Alternative AI provider
- **Uploadcare**: [uploadcare.com](https://uploadcare.com) - Alternative file storage

### 4. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (/chat, /upload, /webhooks)
│   ├── layout.tsx         # Root layout with Clerk
│   └── page.tsx           # Home page
├── components/            
│   ├── chat/             # Chat interface & messages
│   ├── sidebar/          # Navigation & chat history
│   └── ui/               # Reusable components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities & configurations
├── store/                # Zustand state management
└── types/                # TypeScript definitions
```

## 🔌 API Endpoints

- `POST /api/chat` - Send messages, get AI responses
- `POST /api/upload` - Upload files to Cloudinary
- `POST /api/webhooks` - Receive external callbacks
- `POST /api/webhooks/test` - Test webhook integration

## 📤 File Upload

**Supported formats:**
- Images: JPEG, PNG, GIF, WebP, SVG
- Documents: PDF, Word, Excel
- Text: TXT, CSV, JSON

**Limits:** 10MB per file

## 🔗 Webhook Integration

For external service callbacks (file processing, background tasks):

```bash
# Test webhook
curl -X POST http://localhost:3000/api/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "https://your-service.com/webhook"}'
```

**Webhook payload example:**
```json
{
  "id": "webhook-123",
  "type": "file.processing.completed",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "fileId": "file-123",
    "userId": "user-456",
    "extractedText": "..."
  }
}
```

## 🚢 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy automatically

### Other Platforms

Works on: Netlify, Railway, Render, AWS, Docker

## 🎨 Customization

**Change AI Model:**
Edit `src/app/api/chat/route.ts` and update model configuration

**Modify Theme:**
Update colors in `tailwind.config.ts` and component styles

**Add Features:**
- New AI providers in `/api/chat`
- File processors in `/api/upload`
- Webhook handlers in `/api/webhooks`

## 🐛 Common Issues

**Authentication not working:**
- Check Clerk keys and domain settings
- Verify middleware configuration

**File upload failing:**
- Confirm Cloudinary credentials
- Check file size/type limits

**AI not responding:**
- Verify Groq API key
- Check rate limits and quotas

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk public key |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key |
| `GROQ_API_KEY` | ✅ | Groq AI API key |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` |  | Cloudinary secret |
| `MONGODB_URI` | ❌ | MongoDB connection string |
| `MEM0_API_KEY` | ✅ | Mem0 memory service key |
| `OPENAI_API_KEY` | ❌ | OpenAI API key |
| `WEBHOOK_SECRET` | ❌ | Webhook signature verification |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Credits

Built with Next.js 15, Clerk, Groq, and Cloudinary

---

**Need help?** Open an [issue](https://github.com/yourusername/chatgpt-clone/issues) or check the [docs](https://github.com/yourusername/chatgpt-clone/wiki)
