# GarmentPOS - Complete Mobile POS System

A comprehensive React Native mobile application for garment store management with offline-first architecture, Supabase backend integration, and Bluetooth printing capabilities.

## 🚀 Features

### Core Functionality

- **Offline-First Architecture** - Works without internet connection
- **Real-Time Sync** - Automatic data synchronization with Supabase
- **Order Management** - Complete order creation and tracking
- **Measurement Tracking** - Detailed shirt and trouser measurements
- **Picture Management** - Customer photos and garment samples
- **Bluetooth Printing** - Receipt and job sheet printing
- **Analytics Dashboard** - Business insights and reporting
- **Diagnostic Center** - System health and testing tools

### Technical Features

- **SQLite Database** - Local data storage
- **Supabase Integration** - Cloud backend and authentication
- **Image Upload** - Supabase Storage with progress tracking
- **Network Monitoring** - Automatic sync on connectivity
- **Conflict Resolution** - Smart data synchronization
- **Performance Optimization** - Efficient data handling
- **Comprehensive Testing** - Unit, integration, and E2E tests

## 📱 Screenshots

_Screenshots would be added here showing the app interface_

## 🛠️ Installation

### Prerequisites

- Node.js (>= 20)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Supabase account

### Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd MyApp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Setup platform-specific dependencies**

   ```bash
   # For Android
   npm run setup:android

   # For iOS (macOS only)
   npm run setup
   ```

5. **Run the application**

   ```bash
   # Android
   npm run android

   # iOS
   npm run ios
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

1. **Create a new Supabase project**
2. **Run the database migrations** (see Database Setup section)
3. **Configure storage bucket** for image uploads
4. **Set up Row Level Security (RLS)** policies

### Database Setup

The app will automatically create the required tables on first run. For manual setup:

```sql
-- Orders table
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT,
  return_date TEXT,
  notes TEXT,
  advance REAL DEFAULT 0,
  total REAL DEFAULT 0,
  balance REAL DEFAULT 0,
  picture_url TEXT,
  sync_status TEXT DEFAULT 'pending',
  last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Measurements table
CREATE TABLE measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  shirt_length REAL,
  shoulder REAL,
  arm REAL,
  chest REAL,
  waist REAL,
  hip REAL,
  neck REAL,
  crossback REAL,
  trouser_length REAL,
  trouser_waist REAL,
  thigh REAL,
  knee REAL,
  bottom REAL,
  last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
);

-- Business info table
CREATE TABLE business_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_name TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test:run:all

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance

# Run with coverage
npm run test:coverage
```

### Test Suites

- **Unit Tests** - Individual component and function testing
- **Integration Tests** - Service and API integration testing
- **End-to-End Tests** - Complete user workflow testing
- **Performance Tests** - Load and performance testing
- **Offline Tests** - Offline functionality testing
- **Sync Tests** - Data synchronization testing
- **Printing Tests** - Print functionality testing
- **Storage Tests** - File upload and storage testing

## 🚀 Building and Deployment

### Android Build

```bash
# Debug build
npm run build:android:debug

# Release build
npm run build:android:release

# Manual build
node build-android.js release
```

### Build Artifacts

After successful build:

- APK files in `releases/` directory
- Build report in `build-report.json`
- Release notes in `RELEASE_NOTES.md`
- Build info in `build-info.json`

### Production Deployment

1. **Follow the production checklist** in `FINAL_INTEGRATION_GUIDE.md`
2. **Configure Supabase production environment**
3. **Build release APK**
4. **Test on production devices**
5. **Deploy to app stores**

## 📚 Usage Guide

### Creating an Order

1. **Navigate to "New Order"**
2. **Fill customer information**
3. **Add measurements** (shirt and/or trouser)
4. **Set payment details**
5. **Add notes and special instructions**
6. **Take customer photo** (optional)
7. **Save order**

### Managing Orders

1. **View orders list** with search and filter
2. **View order details** with all information
3. **Edit orders** (if not synced)
4. **Print receipts and job sheets**
5. **Track sync status**

### Printing

1. **Connect Bluetooth printer**
2. **Test print** from Diagnostic Center
3. **Print receipts** from order details
4. **Print job sheets** with measurements
5. **Configure business profile**

### Offline Usage

1. **App works offline** by default
2. **Create orders** without internet
3. **Data syncs automatically** when online
4. **View sync status** in dashboard
5. **Manual sync** available in settings

## 🔧 Troubleshooting

### Common Issues

#### Sync Issues

```bash
# Check sync status
npm run test:sync

# Reset failed syncs
# Use Diagnostic Center in app
```

#### Database Issues

```bash
# Check database
npm run test:database

# Clear database (use with caution)
# Use Diagnostic Center in app
```

#### Print Issues

```bash
# Test printing
npm run test:printing

# Check printer connection
# Use Diagnostic Center in app
```

### Debug Commands

```bash
# Enable debug logging
# Set DEBUG=true in .env

# Check network status
# Use Diagnostic Center in app

# View sync log
# Use Diagnostic Center in app
```

## 📊 Performance

### Optimization Features

- **Database indexing** for fast queries
- **Image compression** for efficient storage
- **Batch operations** for sync
- **Memory management** for large datasets
- **Lazy loading** for better performance

### Performance Metrics

- **App launch time** < 3 seconds
- **Order creation** < 2 seconds
- **Sync operation** < 5 seconds
- **Print generation** < 1 second
- **Memory usage** < 100MB

## 🔒 Security

### Security Features

- **Data encryption** at rest
- **Secure API communication**
- **User authentication**
- **Row Level Security (RLS)**
- **Input validation**
- **SQL injection prevention**

### Best Practices

- **Regular security updates**
- **API key rotation**
- **User session management**
- **Data backup and recovery**
- **Access control**

## 🤝 Contributing

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Run tests**
5. **Submit a pull request**

### Code Standards

- **ESLint** for code quality
- **Prettier** for formatting
- **TypeScript** for type safety
- **Jest** for testing
- **Conventional commits** for commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation

- **API Documentation** - `docs/API.md`
- **Sync Flow** - `docs/Sync_Flow.md`
- **Printing Integration** - `docs/Printing_Integration.md`
- **Screen Flow** - `docs/Screen_Flow.md`
- **Developer Guide** - `docs/Developer&ntegration_Testing.md`
- **Final Integration** - `FINAL_INTEGRATION_GUIDE.md`

### Getting Help

1. **Check the documentation**
2. **Run diagnostic tests**
3. **Check the troubleshooting section**
4. **Create an issue** on GitHub
5. **Contact the development team**

## 🎯 Roadmap

### Upcoming Features

- [ ] **Multi-language support**
- [ ] **Advanced analytics**
- [ ] **Inventory management**
- [ ] **Customer management**
- [ ] **Payment integration**
- [ ] **Cloud backup**
- [ ] **Multi-store support**
- [ ] **API for third-party integration**

### Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Performance optimizations
- **v1.2.0** - Enhanced sync capabilities
- **v1.3.0** - Print improvements
- **v1.4.0** - Analytics dashboard

## 🙏 Acknowledgments

- **React Native** for the mobile framework
- **Supabase** for the backend services
- **SQLite** for local database
- **React Navigation** for navigation
- **Jest** for testing framework
- **ESLint** for code quality

---

**GarmentPOS** - Empowering garment stores with modern technology and offline-first architecture.

For more information, visit the [documentation](FINAL_INTEGRATION_GUIDE.md) or contact the development team.
