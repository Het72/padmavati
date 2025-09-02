# Backend API with Image Upload

This is a Node.js backend API with Express and MongoDB, featuring product management with image upload capabilities and email notifications.

## Features

- User authentication and authorization
- Product management (CRUD operations) with image uploads
- Cart PDF generation and email delivery
- Cart and order management
- PDF generation for invoices and cart summaries
- Email integration for PDF delivery and notifications
- Notification service (Email + SMS)

## Image Upload Features

### Supported Image Formats
- JPEG/JPG
- PNG
- GIF
- WebP

### Image Upload Limits
- Maximum file size: 20MB per image
- Maximum images per product: 5
- Images are stored locally in the `uploads/products/` directory

## Email Integration Features

### What You Can Do
- **Send Cart PDFs** to any email address
- **Send Order Confirmations** with invoice PDFs
- **Professional email templates** with order details
- **Automatic PDF delivery** after checkout


### Email API Endpoints

#### Send Cart PDF via Email
```bash
POST /api/cart/generate-pdf/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@example.com"
}
```

## API Endpoints

### Products

#### Create Product with Image
```
POST /api/products
Content-Type: multipart/form-data
Authorization: Bearer <admin_token>
Role: Admin

Form Data:
- name: string (required)
- description: string (required)
- price: number (required)
- category: string (required)
- stock: number (required)
- image: file (optional)
```

#### Upload Multiple Images to Existing Product
```
POST /api/products/upload-images/:id
Content-Type: multipart/form-data
Authorization: Bearer <admin_token>
Role: Admin

Form Data:
- images: files (up to 5 images)
```

#### Update Product with Optional Image
```
PUT /api/products/:id
Content-Type: multipart/form-data
Authorization: Bearer <admin_token>
Role: Admin

Form Data:
- name: string (optional)
- description: string (optional)
- price: number (optional)
- category: string (optional)
- stock: number (optional)
- image: file (optional)
```

### Cart



## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your configuration:
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

## Email Setup

### 1. Mailtrap (Recommended for Development)
**Perfect for testing - emails are caught and never sent to real recipients**

1. Go to [Mailtrap.io](https://mailtrap.io/) and create a free account
2. Create a new inbox
3. Go to SMTP Settings → Show Credentials
4. Copy the username and password

**Environment Variables:**
```bash
EMAIL_SERVICE=mailtrap
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password
```

### 2. Ethereal (Free Testing Service)
**Built-in nodemailer testing service - no account needed**

**Environment Variables:**
```bash
EMAIL_SERVICE=ethereal
ETHEREAL_USER=your_ethereal_username
ETHEREAL_PASS=your_ethereal_password
```

### 3. Brevo (Free Tier - 300 emails/day)
**Professional email service with excellent deliverability**

1. Go to [Brevo.com](https://brevo.com/) and create a free account
2. Verify your sender email address
3. Go to **SMTP & API** → **SMTP** to get your credentials
4. Use your email as username and API key as password

**Environment Variables:**
```bash
EMAIL_SERVICE=brevo
BREVO_USER=your_brevo_email@domain.com
BREVO_API_KEY=your_brevo_api_key
```

### 4. SendGrid (Free Tier - 100 emails/day)
**Professional email service with good deliverability**

1. Go to [SendGrid.com](https://sendgrid.com/) and create a free account
2. Create an API key
3. Use the API key as password

**Environment Variables:**
```bash
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
```

### 4. Gmail (Fallback)
**Traditional Gmail setup with app password**

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Enable 2-Factor Authentication if not already enabled
3. Go to Security → App passwords
4. Generate a new app password for "Mail"

**Environment Variables:**
```bash
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

## Email Configuration
For PDF delivery via email, choose one of these services:

**Mailtrap (Recommended for Development):**
```bash
EMAIL_SERVICE=mailtrap
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password
```

**Brevo (Free Tier - Production Ready):**
```bash
EMAIL_SERVICE=brevo
BREVO_USER=your_brevo_email@domain.com
BREVO_API_KEY=your_brevo_api_key
```

**SendGrid (Free Tier - Production Ready):**
```bash
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
```

**Gmail (Fallback):**
```bash
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

**Note:** 
- **Mailtrap** is perfect for development/testing (emails are caught, never sent)
- **Brevo** offers 300 free emails/day with excellent deliverability and professional features
- **SendGrid** offers 100 free emails/day with professional deliverability
- **Gmail** requires app password setup but is free

## File Structure

```
backend1/
├── config/
│   └── config.js
├── middleware/
│   ├── auth.js
│   └── upload.js          # Image upload middleware
├── models/
│   ├── Cart.js
│   ├── Order.js
│   ├── Product.js
│   └── User.js
├── routes/
│   ├── cart.js            # Updated: Cart PDF generation
│   ├── orders.js
│   ├── products.js        # Image upload support
│   └── users.js
├── utils/
│   ├── imageUtils.js      # Image processing utilities
│   ├── notificationService.js # Enhanced with email notifications
│   ├── pdfGenerator.js    # Updated: Cart PDF support
│   └── emailService.js    # Email service for PDF delivery
├── uploads/               # Image storage directory
│   └── products/
├── temp/                  # Temporary files (PDFs)
├── server.js
└── package.json
```

## Usage Examples

### Frontend Integration

#### Generate Cart PDF and Send via Email
```javascript
fetch(`/api/cart/generate-pdf/${userId}`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        email: 'user@example.com'
    })
});
```



### Checkout Flow
The checkout process now automatically sends PDF invoices via email:
1. User fills checkout form with email address
2. Order is processed and PDF invoice is generated
3. Invoice is automatically sent to user's email

## Error Handling

The API includes comprehensive error handling for:
- File size limits
- File type validation
- Upload errors
- Database errors
- Authentication errors

## Security Features

- File type validation
- File size limits
- Authentication required for uploads
- Admin role required for product management
- Secure file naming to prevent conflicts

## Notes

- Images are stored locally on the server
- Old images are automatically cleaned up when products are updated or deleted
- Image URLs are generated automatically and include the server host
- The uploads directory is served statically for easy access to images
