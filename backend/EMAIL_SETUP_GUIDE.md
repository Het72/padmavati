# 📧 Email Service Setup Guide

This guide will help you set up email delivery for your PDF invoices using one of the supported email providers.

## 🎯 **Recommended Setup for Development: Mailtrap**

### Why Mailtrap?
- ✅ **Free forever** (100 emails/month)
- ✅ **Emails are caught** - never sent to real recipients
- ✅ **Perfect for testing** without spamming customers
- ✅ **No complex setup** required
- ✅ **Professional inbox** interface

### Setup Steps:
1. Go to [Mailtrap.io](https://mailtrap.io/) and sign up for free
2. Create a new inbox (e.g., "Development", "Testing")
3. Click on the inbox → **SMTP Settings**
4. Copy the **Username** and **Password**
5. Update your `.env` file:

```bash
EMAIL_SERVICE=mailtrap
MAILTRAP_USER=your_username_here
MAILTRAP_PASS=your_password_here
```

### Test:
```bash
npm run test:email
```

## 🚀 **Production Ready: Brevo (Recommended)**

### Why Brevo?
- ✅ **300 free emails/day** forever (3x more than SendGrid!)
- ✅ **Excellent deliverability** (99%+ success rate)
- ✅ **Professional email templates** and automation
- ✅ **Production ready** for real customers
- ✅ **Easy setup** with SMTP credentials
- ✅ **Advanced features** like email tracking and analytics

## 🚀 **Production Ready: SendGrid**

### Why SendGrid?
- ✅ **100 free emails/day** forever
- ✅ **Professional deliverability** (99%+ success rate)
- ✅ **Email analytics** and tracking
- ✅ **Production ready** for real customers
- ✅ **Easy setup** with API keys

### Setup Steps:
1. Go to [SendGrid.com](https://sendgrid.com/) and create free account
2. Verify your sender email address
3. Go to **Settings** → **API Keys**
4. Create a new API key with **Mail Send** permissions
5. Copy the API key
6. Update your `.env` file:

```bash
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_api_key_here
```

### Test:
```bash
npm run test:email
```

## 🧪 **Built-in Testing: Ethereal**

### Why Ethereal?
- ✅ **Completely free** - no account needed
- ✅ **Built into nodemailer** - no external service
- ✅ **Perfect for quick testing**
- ✅ **No setup required**

### Setup Steps:
1. No account creation needed!
2. Update your `.env` file:

```bash
EMAIL_SERVICE=ethereal
```

3. Run the test - it will generate credentials automatically:

```bash
npm run test:email
```

4. Copy the generated credentials to your `.env` file:

```bash
EMAIL_SERVICE=ethereal
ETHEREAL_USER=generated_username
ETHEREAL_PASS=generated_password
```

## 📱 **Traditional: Gmail**

### Why Gmail?
- ✅ **Completely free**
- ✅ **Familiar interface**
- ✅ **Good for personal projects**

### Setup Steps:
1. Enable 2-Factor Authentication on your Google Account
2. Go to **Security** → **App passwords**
3. Generate app password for "Mail"
4. Update your `.env` file:

```bash
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

## 🔧 **Quick Setup Commands**

### 1. Copy environment template:
```bash
cp env.example .env
```

### 2. Edit .env file with your chosen provider:
```bash
# For Mailtrap (Recommended)
EMAIL_SERVICE=mailtrap
MAILTRAP_USER=your_username
MAILTRAP_PASS=your_password

# For Brevo (Recommended for Production)
EMAIL_SERVICE=brevo
BREVO_USER=your_brevo_email@domain.com
BREVO_API_KEY=your_brevo_api_key

# For SendGrid
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_api_key

# For Ethereal
EMAIL_SERVICE=ethereal

# For Gmail
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### 3. Test your setup:
```bash
npm run test:email
```

## 📊 **Provider Comparison**

| Provider | Free Tier | Setup Difficulty | Best For | Production Ready |
|----------|------------|------------------|-----------|------------------|
| **Mailtrap** | 100 emails/month | ⭐ Easy | Development/Testing | ❌ No |
| **Brevo** | 300 emails/day | ⭐⭐ Easy | Production | ✅ Yes |
| **SendGrid** | 100 emails/day | ⭐⭐ Medium | Production | ✅ Yes |
| **Ethereal** | Unlimited | ⭐ Very Easy | Quick Testing | ❌ No |
| **Gmail** | Unlimited | ⭐⭐⭐ Hard | Personal Projects | ⚠️ Limited |

## 🎉 **You're Ready!**

Once you've set up any of these providers:

1. **Checkout emails** will be sent automatically
2. **Cart PDFs** will be delivered via email
3. **Professional templates** with your branding
4. **PDF attachments** included automatically

## 🆘 **Need Help?**

### Common Issues:

**"Authentication failed"**
- Check your credentials are correct
- For Gmail: Make sure you're using app password, not regular password
- For SendGrid: Verify your sender email is verified

**"Connection timeout"**
- Check your internet connection
- Verify the SMTP settings are correct
- Some corporate networks block SMTP ports

**"Rate limit exceeded"**
- You've hit the free tier limit
- Wait for the next day (SendGrid) or month (Mailtrap)
- Consider upgrading to paid plan

### Test Your Setup:
```bash
npm run test:email
```

This will show you exactly what's working and what needs to be fixed!
