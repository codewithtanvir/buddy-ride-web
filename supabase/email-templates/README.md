# Enhanced Email Templates for Buddy Ride

This directory contains robust and dynamic email templates for Supabase Auth emails in the Buddy Ride application.

## 📧 Available Templates

### 1. **Confirmation Email** (`confirmation.html`)

- **Purpose**: Welcome new users and confirm their email address
- **Features**:
  - Welcoming design with Buddy Ride branding
  - Feature highlights to engage new users
  - Alternative verification code option
  - Security notes and expiration warnings
  - Mobile-responsive design

### 2. **Password Recovery** (`recovery.html`)

- **Purpose**: Help users reset their forgotten passwords
- **Features**:
  - Security-focused design with warning colors
  - Clear reset instructions
  - Security best practices tips
  - Request information display
  - Unauthorized access warnings

### 3. **Magic Link** (`magic_link.html`)

- **Purpose**: Provide passwordless login via email
- **Features**:
  - "Magic" themed design with animated elements
  - One-click login functionality
  - Alternative verification code
  - Platform benefits highlighting
  - Quick access messaging

### 4. **Invitation Email** (`invite.html`)

- **Purpose**: Invite new users to join the platform
- **Features**:
  - Celebration-themed design
  - Community statistics
  - Welcome bonus information
  - Feature grid showcase
  - Limited-time invitation urgency

### 5. **Email Change** (`email_change.html`)

- **Purpose**: Confirm email address changes
- **Features**:
  - Clear before/after email display
  - Security-focused messaging
  - Benefits of email updates
  - Unauthorized change warnings
  - Support contact information

## 🎨 Design Features

All templates include:

- **Responsive Design**: Works perfectly on mobile and desktop
- **Buddy Ride Branding**: Consistent colors and messaging
- **Modern Styling**: Gradient backgrounds, rounded corners, shadows
- **Security Elements**: Clear warnings and expiration notices
- **Accessibility**: High contrast, readable fonts, semantic HTML
- **Interactive Elements**: Hover effects, prominent call-to-action buttons

## 🔧 Implementation Instructions

### For Local Development:

1. **Update your `supabase/config.toml` file:**

```toml
[auth.email.template.confirmation]
subject = "🚗 Welcome to Buddy Ride - Confirm Your Account!"
content_path = "./supabase/email-templates/confirmation.html"

[auth.email.template.recovery]
subject = "🔐 Reset Your Buddy Ride Password"
content_path = "./supabase/email-templates/recovery.html"

[auth.email.template.magic_link]
subject = "✨ Your Buddy Ride Magic Link - Instant Access!"
content_path = "./supabase/email-templates/magic_link.html"

[auth.email.template.invite]
subject = "🎉 You're Invited to Join Buddy Ride!"
content_path = "./supabase/email-templates/invite.html"

[auth.email.template.email_change]
subject = "📧 Confirm Your Email Change - Buddy Ride"
content_path = "./supabase/email-templates/email_change.html"
```

2. **Restart your Supabase containers:**

```bash
supabase stop && supabase start
```

### For Hosted Projects:

1. **Go to your Supabase Dashboard**
2. **Navigate to Authentication > Email Templates**
3. **Copy and paste each HTML template into the corresponding email type**
4. **Update the subject lines as specified above**
5. **Save each template**

### Using the Management API:

You can also update templates programmatically:

```bash
# Set your environment variables
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# Update confirmation email template
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_subjects_confirmation": "🚗 Welcome to Buddy Ride - Confirm Your Account!",
    "mailer_templates_confirmation_content": "<!-- Paste confirmation.html content here -->"
  }'
```

## 📱 Available Template Variables

All templates use these Supabase variables:

- `{{ .ConfirmationURL }}` - The confirmation/action link
- `{{ .Token }}` - 6-digit OTP code
- `{{ .TokenHash }}` - Hashed token for custom URLs
- `{{ .SiteURL }}` - Your application's site URL
- `{{ .Email }}` - User's current email address
- `{{ .NewEmail }}` - New email address (email_change only)
- `{{ .RedirectTo }}` - Redirect URL after confirmation

## 🛡️ Security Features

- **Expiration Warnings**: All templates include clear expiration timeframes
- **Unauthorized Access Notices**: Users are warned about unauthorized requests
- **Security Contact**: Direct links to security team for issues
- **Alternative Methods**: Both link and code options for verification

## 🎨 Customization

### Colors and Branding:

- **Primary**: `#667eea` to `#764ba2` (purple gradient)
- **Success**: `#38b2ac` (teal)
- **Warning**: `#ed8936` (orange)
- **Danger**: `#f56565` (red)
- **Background**: `#f8fafc` (light gray)

### Typography:

- **Font**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`
- **Headings**: Bold, 28px for main titles
- **Body**: 14-16px for readable content
- **Code**: `'Courier New', monospace` for tokens

## 📧 Email Testing

### Local Testing with Mailpit:

1. Run `supabase status` to get the Mailpit URL
2. Navigate to the Mailpit interface in your browser
3. Test email flows and see the templates in action

### Production Testing:

1. Use a test email address for signup/login flows
2. Check spam folders for deliverability
3. Test on multiple email clients (Gmail, Outlook, etc.)
4. Verify mobile rendering

## 🚀 Deployment Checklist

- [ ] Templates uploaded to Supabase Dashboard or configured locally
- [ ] Subject lines updated with emojis and branding
- [ ] SMTP settings configured for production
- [ ] Rate limits adjusted for expected volume
- [ ] Email deliverability tested across providers
- [ ] Mobile responsiveness verified
- [ ] All template variables working correctly
- [ ] Security notices and expiration times appropriate
- [ ] Support contact information updated

## 📞 Support

For issues with email templates or configuration:

- **Email**: support@buddyride.com
- **Security**: security@buddyride.com
- **Documentation**: [Supabase Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)

---

**Note**: Remember to update contact information, URLs, and branding elements to match your actual Buddy Ride application details before deployment.
